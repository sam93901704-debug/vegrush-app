# Branding Asset Generation

## Quick Start

To generate all branding assets for VegRush and VegRush Delivery:

### Using Node.js Script (Recommended)

```bash
node scripts/generate-branding-assets.js
```

### Using Bash Script

```bash
chmod +x scripts/generate-branding-assets.sh
./scripts/generate-branding-assets.sh
```

## Prerequisites

- **ImageMagick** must be installed
  - Windows: Download from [ImageMagick](https://imagemagick.org/script/download.php)
  - Mac: `brew install imagemagick`
  - Linux: `sudo apt-get install imagemagick`

## What Gets Generated

### Customer App (VegRush)
- Web icons: `public/icons/icon-*.png` (16, 32, 64, 128, 256, 512)
- Favicon: `public/favicon.ico`
- Logo: `public/logo.png`
- Android icons: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Splash screen: `android/app/src/main/res/drawable/splash.png`

### Delivery App (VegRush Delivery)
- Same structure in `apps/delivery/` directory

## Source Files

- Customer app uses: `branding/vegrush/logo-main.png`
- Delivery app uses: `branding/vegrush/logo-delivery.png`

## After Generation

1. Verify all files were created
2. Test icons in browser (favicon should appear)
3. Build Android app and verify icons/splash screen
4. Check PWA manifest works correctly

