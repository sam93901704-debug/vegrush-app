# Public Assets Directory

This directory contains public assets for the VegRush customer app.

## Structure

```
public/
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-64.png
│   ├── icon-128.png
│   ├── icon-256.png
│   └── icon-512.png
├── favicon.ico
├── logo.png
└── manifest.json
```

## Generating Assets

Run the branding asset generator:

```bash
node scripts/generate-branding-assets.js
```

Or use the bash script:

```bash
./scripts/generate-branding-assets.sh
```

## Assets Description

- **Icons**: Web app icons in various sizes (16px to 512px)
- **Favicon**: Browser favicon (32x32)
- **Logo**: General app logo (512x512)
- **Manifest**: PWA manifest file with app metadata

All assets are generated from `branding/vegrush/logo-main.png`.

