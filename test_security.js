// Quick security validation test
// Run with: node test_security.js

console.log('🔒 Security Configuration Test\n');

// Test 1: Check if .env file exists
const fs = require('fs');
const path = require('path');

try {
    if (fs.existsSync('.env')) {
        console.log('✅ .env file exists');
    } else {
        console.log('⚠️  .env file not found - copy from .env.example');
    }
} catch (err) {
    console.log('❌ Error checking .env:', err.message);
}

// Test 2: Check if .env is in .gitignore
try {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env')) {
        console.log('✅ .env is in .gitignore');
    } else {
        console.log('❌ .env is NOT in .gitignore - add it now!');
    }
} catch (err) {
    console.log('⚠️  .gitignore not found');
}

// Test 3: Load environment variables
require('dotenv').config();

const requiredVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
];

console.log('\n📋 Environment Variables Check:');
requiredVars.forEach(varName => {
    if (process.env[varName]) {
        if (process.env[varName].includes('your-') || process.env[varName].includes('change-this')) {
            console.log(`⚠️  ${varName} - exists but needs to be configured`);
        } else {
            console.log(`✅ ${varName} - configured`);
        }
    } else {
        console.log(`❌ ${varName} - missing`);
    }
});

// Test 4: Check if new packages are in package.json
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredPackages = [
        'express-validator',
        'express-rate-limit',
        'helmet',
        'compression'
    ];
    
    console.log('\n📦 Required Packages Check:');
    requiredPackages.forEach(pkgName => {
        if (pkg.dependencies[pkgName] || pkg.devDependencies[pkgName]) {
            console.log(`✅ ${pkgName} - in package.json`);
        } else {
            console.log(`❌ ${pkgName} - missing from package.json`);
        }
    });
    
    // Check if packages are installed
    console.log('\n💿 Installed Packages Check:');
    requiredPackages.forEach(pkgName => {
        if (fs.existsSync(path.join('node_modules', pkgName))) {
            console.log(`✅ ${pkgName} - installed`);
        } else {
            console.log(`⚠️  ${pkgName} - not installed (run: npm install)`);
        }
    });
    
} catch (err) {
    console.log('❌ Error checking packages:', err.message);
}

console.log('\n✨ Test complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install (to install new security packages)');
console.log('2. Configure your .env file with real credentials');
console.log('3. Read SECURITY_SETUP_GUIDE.md for important security information');
console.log('4. Start the server: npm run dev');
