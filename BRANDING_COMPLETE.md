# VegRush Branding Setup - Complete ✅

All branding configuration has been set up for VegRush and VegRush Delivery apps.

## What Has Been Done

### ✅ Configuration Files Updated

1. **`app/layout.tsx`**
   - Title: "VegRush - Fresh Vegetables Delivered Fast"
   - Description updated
   - Icons metadata configured
   - Manifest reference added
   - Theme color: #16a34a (green)

2. **`public/manifest.json`**
   - App name: "VegRush"
   - Short name: "VegRush"
   - Icons configuration
   - Theme color: #16a34a

3. **`capacitor.config.ts`**
   - App ID: `com.vegrush.customer`
   - App Name: "VegRush"

4. **`package.json`**
   - Added `branding:generate` script
   - Updated app name to "vegrush"

### ✅ Asset Generation Scripts Created

1. **`scripts/generate-branding-assets.js`** (Node.js)
   - Generates all web icons (16-512px)
   - Generates favicon.ico
   - Generates logo.png
   - Generates Android adaptive icons (all densities)
   - Generates splash screens

2. **`scripts/generate-branding-assets.sh`** (Bash)
   - Alternative script for Linux/Mac users

### ✅ Directory Structure Created

- `public/icons/` - Ready for web icons
- `public/` - Ready for favicon and logo
- Android directories will be created when you run `npx cap add android`

## Next Steps

### 1. Install ImageMagick

**Windows:**
- Download from: https://imagemagick.org/script/download.php
- Install and add to PATH

**Mac:**
```bash
brew install imagemagick
```

**Linux:**
```bash
sudo apt-get install imagemagick
```

### 2. Generate Assets

Run the asset generation script:

```bash
npm run branding:generate
```

Or directly:
```bash
node scripts/generate-branding-assets.js
```

This will generate:
- ✅ All web icons in `public/icons/`
- ✅ `public/favicon.ico`
- ✅ `public/logo.png`
- ✅ Android icons (after you add Android platform)
- ✅ Splash screens (after you add Android platform)

### 3. Add Android Platform (if not done)

```bash
npx cap add android
```

Then regenerate assets:
```bash
npm run branding:generate
```

### 4. Verify Assets

- Check `public/icons/` contains all icon sizes
- Check `public/favicon.ico` exists
- Check `public/logo.png` exists
- Check Android icons in `android/app/src/main/res/mipmap-*/`
- Check splash screen in `android/app/src/main/res/drawable/`

### 5. Test

- **Web**: Open app in browser, check favicon appears
- **PWA**: Install as PWA, verify icons
- **Android**: Build APK, check app icon and splash screen

## Source Files

The scripts use these source logos:
- Customer App: `branding/vegrush/logo-main.png`
- Delivery App: `branding/vegrush/logo-delivery.png`

Make sure these files exist before running the generation script.

## Delivery App Setup

For the delivery app, you'll need to:

1. Create separate layout.tsx in delivery app directory (if separate Next.js app)
2. Create separate capacitor.config.ts for delivery app
3. Update app name to "VegRush Delivery" in delivery app configs

The generation script handles both apps automatically.

## Troubleshooting

### Script fails with "ImageMagick not found"
→ Install ImageMagick and ensure it's in your PATH

### Icons look pixelated
→ Ensure source logos are high resolution (1024x1024+)

### Android icons don't appear
→ Run `npx cap sync` after generating assets

### Splash screen doesn't show
→ Check Capacitor splash screen plugin is installed

## Files Created/Modified

### Created:
- `scripts/generate-branding-assets.js`
- `scripts/generate-branding-assets.sh`
- `public/manifest.json`
- `public/icons/.gitkeep`
- `BRANDING_SETUP.md`
- `ANDROID_ASSETS_STRUCTURE.md`
- `BRANDING_COMPLETE.md`

### Modified:
- `app/layout.tsx` - Updated metadata and branding
- `capacitor.config.ts` - Updated app ID and name
- `package.json` - Added branding script

## Summary

✅ All configuration files updated with VegRush branding
✅ Asset generation scripts ready
✅ Directory structure prepared
⏳ **Next**: Run `npm run branding:generate` to create actual image files

Once you run the generation script, all branding assets will be created and ready to use!

