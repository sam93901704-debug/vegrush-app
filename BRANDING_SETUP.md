# VegRush Branding Setup Guide

This guide explains how to set up branding assets for VegRush and VegRush Delivery apps.

## Prerequisites

1. **ImageMagick** installed on your system
   - Windows: Download from [ImageMagick website](https://imagemagick.org/script/download.php)
   - Mac: `brew install imagemagick`
   - Linux: `sudo apt-get install imagemagick`

2. **Source logo files** in `branding/vegrush/`:
   - `logo-main.png` (Customer app)
   - `logo-delivery.png` (Delivery app)

## Quick Start

### Option 1: Using Node.js Script (Recommended)

```bash
node scripts/generate-branding-assets.js
```

### Option 2: Using Bash Script

```bash
chmod +x scripts/generate-branding-assets.sh
./scripts/generate-branding-assets.sh
```

## Generated Assets

### Customer App (VegRush)

#### Web Assets (`public/`)
- `icons/icon-16.png` through `icon-512.png`
- `favicon.ico`
- `logo.png`

#### Android Assets (`android/app/src/main/res/`)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)
- `drawable/splash.png` (1080x1080)

### Delivery App (VegRush Delivery)

#### Web Assets (`apps/delivery/public/`)
- Same structure as customer app

#### Android Assets (`apps/delivery/android/app/src/main/res/`)
- Same structure as customer app

## Manual Asset Generation

If you prefer to generate assets manually or use a different tool:

### Web Icons

Generate icons in sizes: 16, 32, 64, 128, 256, 512 pixels

```bash
# Example for 512px icon
magick branding/vegrush/logo-main.png \
  -resize 512x512 \
  -background transparent \
  -gravity center \
  -extent 512x512 \
  public/icons/icon-512.png
```

### Android Icons

Android adaptive icons need padding (80% safe area):

```bash
# Example for xxhdpi (144px)
magick branding/vegrush/logo-main.png \
  -resize 115x115 \
  -background transparent \
  -gravity center \
  -extent 144x144 \
  android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
```

**Android Icon Sizes:**
- mdpi: 48x48 (safe: 38x38)
- hdpi: 72x72 (safe: 58x58)
- xhdpi: 96x96 (safe: 77x77)
- xxhdpi: 144x144 (safe: 115x115)
- xxxhdpi: 192x192 (safe: 154x154)

### Splash Screen

```bash
# Create gradient background with centered logo
magick -size 1080x1080 gradient:#f0fdf4-#ffffff \
  -gravity center \
  \( branding/vegrush/logo-main.png -resize 432x432 \) \
  -composite \
  android/app/src/main/res/drawable/splash.png
```

## Configuration Files Updated

The following files have been updated with VegRush branding:

1. **`app/layout.tsx`**
   - Title: "VegRush - Fresh Vegetables Delivered Fast"
   - Icons and manifest references
   - Theme color: #16a34a (green)

2. **`public/manifest.json`**
   - App name: "VegRush"
   - Icons configuration
   - Theme color

3. **`capacitor.config.ts`**
   - App ID: `com.vegrush.customer`
   - App Name: "VegRush"

## Verification

After generating assets, verify:

1. **Web Icons**: Check `public/icons/` directory
2. **Favicon**: Check `public/favicon.ico`
3. **Logo**: Check `public/logo.png`
4. **Android Icons**: Check `android/app/src/main/res/mipmap-*/ic_launcher.png`
5. **Splash Screen**: Check `android/app/src/main/res/drawable/splash.png`

## Testing

1. **Web**: Open app in browser, check favicon and manifest
2. **Android**: Build APK and install on device, check app icon and splash screen
3. **PWA**: Install as PWA, verify icons display correctly

## Troubleshooting

### ImageMagick not found
- Install ImageMagick from official website
- Verify installation: `magick -version` or `convert -version`

### Icons look pixelated
- Ensure source logo is high resolution (at least 1024x1024)
- Check that resize commands are using correct dimensions

### Android icons don't display
- Verify icons are in correct density folders
- Check `AndroidManifest.xml` references correct icon
- Rebuild Android project after adding icons

### Splash screen doesn't show
- Verify splash.png is in `drawable` folder
- Check Capacitor splash screen configuration
- Ensure splash screen plugin is installed

## Notes

- Source logos should be PNG format with transparent background
- Recommended source logo size: 1024x1024 or larger
- Android adaptive icons use 80% safe area for proper display
- Splash screen uses soft green gradient background (#f0fdf4 to #ffffff)
- All icons maintain aspect ratio and are centered with padding

## Delivery App Setup

For the delivery app, the same process applies but using `logo-delivery.png`:

1. Run the script (it handles both apps)
2. Assets will be generated in `apps/delivery/` directory
3. Update delivery app's `layout.tsx` and `capacitor.config.ts` separately

