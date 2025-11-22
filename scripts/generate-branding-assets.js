#!/usr/bin/env node

/**
 * Branding Asset Generator Script
 * 
 * This script generates all required branding assets for VegRush apps
 * from the source logo files.
 * 
 * Requirements:
 * - ImageMagick (for image processing)
 * - Node.js
 * 
 * Usage:
 *   node scripts/generate-branding-assets.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  customer: {
    name: 'VegRush',
    logoSource: 'branding/vegrush/logo-main.png',
    outputDir: 'public',
    androidDir: 'android/app/src/main/res',
  },
  delivery: {
    name: 'VegRush Delivery',
    logoSource: 'branding/vegrush/logo-delivery.png',
    outputDir: 'apps/delivery/public',
    androidDir: 'apps/delivery/android/app/src/main/res',
  },
};

// Icon sizes for web
const WEB_ICON_SIZES = [16, 32, 64, 128, 256, 512];

// Android icon sizes (in dp, actual px varies by density)
const ANDROID_ICON_SIZES = {
  'mipmap-mdpi': 48,    // 1x
  'mipmap-hdpi': 72,    // 1.5x
  'mipmap-xhdpi': 96,   // 2x
  'mipmap-xxhdpi': 144, // 3x
  'mipmap-xxxhdpi': 192, // 4x
};

// Splash screen size
const SPLASH_SIZE = 1080; // Large enough for all screen sizes

/**
 * Check if ImageMagick is installed
 */
function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ ImageMagick not found. Please install ImageMagick:');
    console.error('   Windows: https://imagemagick.org/script/download.php');
    console.error('   Mac: brew install imagemagick');
    console.error('   Linux: sudo apt-get install imagemagick');
    return false;
  }
}

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * Generate web icons
 */
function generateWebIcons(config) {
  console.log(`\n📱 Generating web icons for ${config.name}...`);
  
  const iconsDir = path.join(config.outputDir, 'icons');
  ensureDir(iconsDir);
  
  WEB_ICON_SIZES.forEach(size => {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);
    const command = `magick "${config.logoSource}" -resize ${size}x${size} -background transparent -gravity center -extent ${size}x${size} "${outputPath}"`;
    
    try {
      execSync(command, { stdio: 'ignore' });
      console.log(`  ✅ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`  ❌ Failed to generate icon-${size}.png`);
    }
  });
  
  // Generate favicon.ico (16x16 and 32x32 combined)
  const faviconPath = path.join(config.outputDir, 'favicon.ico');
  const command = `magick "${config.logoSource}" -resize 32x32 -background transparent -gravity center -extent 32x32 "${faviconPath}"`;
  
  try {
    execSync(command, { stdio: 'ignore' });
    console.log(`  ✅ Generated favicon.ico`);
  } catch (error) {
    console.error(`  ❌ Failed to generate favicon.ico`);
  }
  
  // Generate logo.png (512x512 for general use)
  const logoPath = path.join(config.outputDir, 'logo.png');
  const logoCommand = `magick "${config.logoSource}" -resize 512x512 -background transparent -gravity center -extent 512x512 "${logoPath}"`;
  
  try {
    execSync(logoCommand, { stdio: 'ignore' });
    console.log(`  ✅ Generated logo.png`);
  } catch (error) {
    console.error(`  ❌ Failed to generate logo.png`);
  }
}

/**
 * Generate Android adaptive icons
 */
function generateAndroidIcons(config) {
  console.log(`\n🤖 Generating Android icons for ${config.name}...`);
  
  Object.entries(ANDROID_ICON_SIZES).forEach(([density, size]) => {
    const iconDir = path.join(config.androidDir, density);
    ensureDir(iconDir);
    
    const outputPath = path.join(iconDir, 'ic_launcher.png');
    // Android adaptive icons need padding (80% of size for safe area)
    const safeSize = Math.floor(size * 0.8);
    const command = `magick "${config.logoSource}" -resize ${safeSize}x${safeSize} -background transparent -gravity center -extent ${size}x${size} "${outputPath}"`;
    
    try {
      execSync(command, { stdio: 'ignore' });
      console.log(`  ✅ Generated ${density}/ic_launcher.png (${size}x${size})`);
    } catch (error) {
      console.error(`  ❌ Failed to generate ${density}/ic_launcher.png`);
    }
  });
}

/**
 * Generate splash screen
 */
function generateSplashScreen(config) {
  console.log(`\n🎨 Generating splash screen for ${config.name}...`);
  
  const drawableDir = path.join(config.androidDir, 'drawable');
  ensureDir(drawableDir);
  
  const outputPath = path.join(drawableDir, 'splash.png');
  // Splash screen: centered logo on gradient background
  // Create gradient background first, then overlay logo
  const logoSize = Math.floor(SPLASH_SIZE * 0.4); // Logo is 40% of screen
  const command = `magick -size ${SPLASH_SIZE}x${SPLASH_SIZE} gradient:#f0fdf4-#ffffff -gravity center \\( "${config.logoSource}" -resize ${logoSize}x${logoSize} \\) -composite "${outputPath}"`;
  
  try {
    execSync(command, { stdio: 'ignore' });
    console.log(`  ✅ Generated splash.png (${SPLASH_SIZE}x${SPLASH_SIZE})`);
  } catch (error) {
    console.error(`  ❌ Failed to generate splash.png`);
    console.error(`  Note: Using simpler command...`);
    // Fallback: just resize logo
    const fallbackCommand = `magick "${config.logoSource}" -resize ${logoSize}x${logoSize} -background "#f0fdf4" -gravity center -extent ${SPLASH_SIZE}x${SPLASH_SIZE} "${outputPath}"`;
    try {
      execSync(fallbackCommand, { stdio: 'ignore' });
      console.log(`  ✅ Generated splash.png (fallback method)`);
    } catch (err) {
      console.error(`  ❌ Failed to generate splash.png (fallback also failed)`);
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🎨 VegRush Branding Asset Generator\n');
  
  // Check ImageMagick
  if (!checkImageMagick()) {
    process.exit(1);
  }
  
  // Check if source logos exist
  Object.entries(CONFIG).forEach(([app, config]) => {
    if (!fs.existsSync(config.logoSource)) {
      console.error(`❌ Source logo not found: ${config.logoSource}`);
      process.exit(1);
    }
  });
  
  // Generate assets for each app
  Object.entries(CONFIG).forEach(([app, config]) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Generating assets for ${config.name}`);
    console.log('='.repeat(50));
    
    generateWebIcons(config);
    generateAndroidIcons(config);
    generateSplashScreen(config);
  });
  
  console.log('\n✅ Branding asset generation complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review generated assets');
  console.log('   2. Update manifest.json files');
  console.log('   3. Update layout.tsx metadata');
  console.log('   4. Update capacitor.config.ts');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateWebIcons, generateAndroidIcons, generateSplashScreen };

