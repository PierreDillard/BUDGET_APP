-- PostgreSQL initialization script for Budget App
-- This script sets up the database with proper configuration

-- Set timezone
SET timezone = 'Europe/Paris';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set default privileges for better security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO postgres;

-- Performance optimizations
-- These settings are optimized for small to medium applications
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Reload configuration
SELECT pg_reload_conf();

-- Create a function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE(
    status TEXT,
    database_size TEXT,
    connections INTEGER,
    uptime INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'healthy'::TEXT as status,
        pg_size_pretty(pg_database_size(current_database()))::TEXT as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database())::INTEGER as connections,
        (SELECT current_timestamp - pg_postmaster_start_time())::INTERVAL as uptime;
END;
$$ LANGUAGE plpgsql;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Budget App database initialization completed successfully';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'Version: %', version();
    RAISE NOTICE 'Timezone: %', current_setting('timezone');
END $$;
