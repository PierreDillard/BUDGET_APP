#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Test de compilation TypeScript...\n');

try {
  // Changer vers le répertoire backend
  process.chdir(__dirname);
  
  console.log('📦 Vérification des dépendances...');
  
  // Installer les dépendances si nécessaire
  try {
    execSync('npm install', { stdio: 'inherit', timeout: 60000 });
    console.log('✅ Dépendances installées\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation des dépendances:', error.message);
    process.exit(1);
  }
  
  console.log('🔨 Compilation TypeScript...');
  
  // Compiler le projet
  try {
    const result = execSync('npx nest build', { encoding: 'utf-8', timeout: 30000 });
    console.log('✅ Compilation TypeScript réussie !');
    console.log('\n📋 Sortie de compilation:');
    console.log(result);
  } catch (error) {
    console.error('❌ Erreur de compilation TypeScript:');
    console.error(error.stdout || error.message);
    console.error('\n🔍 Détails de l\'erreur:');
    console.error(error.stderr || 'Pas de détails supplémentaires');
    process.exit(1);
  }
  
  console.log('\n🎉 Tous les tests de compilation sont passés !');
  
} catch (error) {
  console.error('❌ Erreur générale:', error.message);
  process.exit(1);
}
