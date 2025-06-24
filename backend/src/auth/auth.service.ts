import { 
  Injectable, 
  ConflictException, 
  UnauthorizedException,
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, currency = 'EUR', monthStartDay = 1, marginPct = 0 } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // Create user
      const user = await this.prisma.users.create({
        data: {
          email,
          password_hash: passwordHash,
          currency,
          month_start_day: monthStartDay,
          margin_pct: marginPct,
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          currency: true,
          month_start_day: true,
          margin_pct: true,
          notification: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Transform database response to camelCase for frontend
      const formattedUser = {
        id: user.id,
        email: user.email,
        currency: user.currency,
        monthStartDay: user.month_start_day,
        marginPct: user.margin_pct,
        notification: user.notification,
        createdAt: user.created_at.toISOString(),
      };

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);

      // Store refresh token
      await this.storeRefreshToken(user.id, refreshToken);

      this.logger.log(`New user registered: ${user.email}`);

      return {
        user: formattedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Error during user registration:', error);
      throw new BadRequestException('Failed to create user account');
    }
  }

  async login(user: any) {
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    // Transform database response to camelCase for frontend
    const formattedUser = {
      id: user.id,
      email: user.email,
      currency: user.currency,
      monthStartDay: user.month_start_day,
      marginPct: user.margin_pct,
      notification: user.notification,
      createdAt: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
    };

    return {
      user: formattedUser,
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'budget-app-refresh-secret',
      });

      // Check if refresh token exists in database
      const storedToken = await this.prisma.refresh_tokens.findUnique({
        where: { token: refreshToken },
        include: { users: true },
      });

      if (!storedToken || storedToken.expires_at < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        storedToken.users.id,
        storedToken.users.email,
      );

      // Remove old refresh token and store new one
      await this.prisma.refresh_tokens.delete({
        where: { token: refreshToken },
      });

      await this.storeRefreshToken(storedToken.users.id, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error('Error refreshing tokens:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(user_id: string, refreshToken?: string) {
    try {
      if (refreshToken) {
        // Remove specific refresh token
        await this.prisma.refresh_tokens.deleteMany({
          where: {
            user_id: user_id,
            token: refreshToken,
          },
        });
      } else {
        // Remove all refresh tokens for user (logout from all devices)
        await this.prisma.refresh_tokens.deleteMany({
          where: { user_id: user_id },
        });
      }

      this.logger.log(`User logged out: ${user_id}`);
    } catch (error) {
      this.logger.error('Error during logout:', error);
    }
  }

  private async generateTokens(user_id: string, email: string) {
    const payload: JwtPayload = { sub: user_id, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'budget-app-secret-key',
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'budget-app-refresh-secret',
      expiresIn: '7d', // Long-lived refresh token
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(user_id: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user_id,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });
  }

  async cleanupExpiredTokens() {
    try {
      const result = await this.prisma.refresh_tokens.deleteMany({
        where: {
          expires_at: {
            lte: new Date(),
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired tokens:', error);
    }
  }
}