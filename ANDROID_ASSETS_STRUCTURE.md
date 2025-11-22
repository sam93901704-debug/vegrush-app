# Android Assets Directory Structure

This document shows the required directory structure for Android assets. These directories will be created automatically when you run `npx cap add android` or can be created manually.

## Customer App (VegRush)

```
android/app/src/main/res/
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png (192x192)
└── drawable/
    └── splash.png (1080x1080)
```

## Delivery App (VegRush Delivery)

```
apps/delivery/android/app/src/main/res/
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png (192x192)
└── drawable/
    └── splash.png (1080x1080)
```

## Generating Assets

Run the branding asset generator script:

```bash
node scripts/generate-branding-assets.js
```

This will automatically create all directories and generate the required icon files.

## Icon Specifications

### Android Adaptive Icons

- **Safe Area**: 80% of total size (to ensure proper display on all devices)
- **Format**: PNG with transparency
- **Background**: Transparent (Android will apply adaptive background)
- **Shape**: Square with rounded corners (handled by Android system)

### Splash Screen

- **Size**: 1080x1080 (works for all screen densities)
- **Background**: Soft gradient (#f0fdf4 to #ffffff)
- **Logo**: Centered, 40% of screen size
- **Format**: PNG

## Notes

- These directories are created automatically when you add the Android platform
- Icons are generated from source logos in `branding/vegrush/`
- The branding script handles all directory creation and asset generation

