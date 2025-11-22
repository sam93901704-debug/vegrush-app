#!/bin/bash

# Branding Asset Generator Script (Bash version)
# Alternative to Node.js script using ImageMagick

set -e

echo "🎨 VegRush Branding Asset Generator"
echo "===================================="
echo ""

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install ImageMagick:"
    echo "   Mac: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    echo "   Windows: https://imagemagick.org/script/download.php"
    exit 1
fi

# Use 'convert' if 'magick' is not available
IMAGEMAGICK_CMD="magick"
if ! command -v magick &> /dev/null; then
    IMAGEMAGICK_CMD="convert"
fi

# Web icon sizes
WEB_SIZES=(16 32 64 128 256 512)

# Android icon sizes (density: size in px)
declare -A ANDROID_SIZES=(
    ["mipmap-mdpi"]=48
    ["mipmap-hdpi"]=72
    ["mipmap-xhdpi"]=96
    ["mipmap-xxhdpi"]=144
    ["mipmap-xxxhdpi"]=192
)

SPLASH_SIZE=1080

# Function to create directory
ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo "✅ Created directory: $1"
    fi
}

# Function to generate web icons
generate_web_icons() {
    local app_name=$1
    local logo_source=$2
    local output_dir=$3
    
    echo ""
    echo "📱 Generating web icons for $app_name..."
    
    local icons_dir="$output_dir/icons"
    ensure_dir "$icons_dir"
    
    for size in "${WEB_SIZES[@]}"; do
        local output_path="$icons_dir/icon-${size}.png"
        $IMAGEMAGICK_CMD "$logo_source" \
            -resize "${size}x${size}" \
            -background transparent \
            -gravity center \
            -extent "${size}x${size}" \
            "$output_path"
        echo "  ✅ Generated icon-${size}.png"
    done
    
    # Generate favicon.ico
    local favicon_path="$output_dir/favicon.ico"
    $IMAGEMAGICK_CMD "$logo_source" \
        -resize "32x32" \
        -background transparent \
        -gravity center \
        -extent "32x32" \
        "$favicon_path"
    echo "  ✅ Generated favicon.ico"
    
    # Generate logo.png
    local logo_path="$output_dir/logo.png"
    $IMAGEMAGICK_CMD "$logo_source" \
        -resize "512x512" \
        -background transparent \
        -gravity center \
        -extent "512x512" \
        "$logo_path"
    echo "  ✅ Generated logo.png"
}

# Function to generate Android icons
generate_android_icons() {
    local app_name=$1
    local logo_source=$2
    local android_dir=$3
    
    echo ""
    echo "🤖 Generating Android icons for $app_name..."
    
    for density in "${!ANDROID_SIZES[@]}"; do
        local size=${ANDROID_SIZES[$density]}
        local icon_dir="$android_dir/$density"
        ensure_dir "$icon_dir"
        
        local output_path="$icon_dir/ic_launcher.png"
        # Android adaptive icons: 80% safe area
        local safe_size=$(echo "$size * 0.8" | bc | cut -d. -f1)
        
        $IMAGEMAGICK_CMD "$logo_source" \
            -resize "${safe_size}x${safe_size}" \
            -background transparent \
            -gravity center \
            -extent "${size}x${size}" \
            "$output_path"
        echo "  ✅ Generated $density/ic_launcher.png (${size}x${size})"
    done
}

# Function to generate splash screen
generate_splash() {
    local app_name=$1
    local logo_source=$2
    local android_dir=$3
    
    echo ""
    echo "🎨 Generating splash screen for $app_name..."
    
    local drawable_dir="$android_dir/drawable"
    ensure_dir "$drawable_dir"
    
    local output_path="$drawable_dir/splash.png"
    local logo_size=$(echo "$SPLASH_SIZE * 0.4" | bc | cut -d. -f1)
    
    # Create gradient background with logo overlay
    $IMAGEMAGICK_CMD \
        -size "${SPLASH_SIZE}x${SPLASH_SIZE}" \
        gradient:#f0fdf4-#ffffff \
        -gravity center \
        \( "$logo_source" -resize "${logo_size}x${logo_size}" \) \
        -composite \
        "$output_path"
    
    echo "  ✅ Generated splash.png (${SPLASH_SIZE}x${SPLASH_SIZE})"
}

# Check if source logos exist
if [ ! -f "branding/vegrush/logo-main.png" ]; then
    echo "❌ Source logo not found: branding/vegrush/logo-main.png"
    exit 1
fi

if [ ! -f "branding/vegrush/logo-delivery.png" ]; then
    echo "❌ Source logo not found: branding/vegrush/logo-delivery.png"
    exit 1
fi

# Generate assets for Customer App
echo ""
echo "=========================================="
echo "Generating assets for VegRush (Customer)"
echo "=========================================="
generate_web_icons "VegRush" "branding/vegrush/logo-main.png" "public"
generate_android_icons "VegRush" "branding/vegrush/logo-main.png" "android/app/src/main/res"
generate_splash "VegRush" "branding/vegrush/logo-main.png" "android/app/src/main/res"

# Generate assets for Delivery App
echo ""
echo "=========================================="
echo "Generating assets for VegRush Delivery"
echo "=========================================="
generate_web_icons "VegRush Delivery" "branding/vegrush/logo-delivery.png" "apps/delivery/public"
generate_android_icons "VegRush Delivery" "branding/vegrush/logo-delivery.png" "apps/delivery/android/app/src/main/res"
generate_splash "VegRush Delivery" "branding/vegrush/logo-delivery.png" "apps/delivery/android/app/src/main/res"

echo ""
echo "✅ Branding asset generation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review generated assets"
echo "   2. Update manifest.json files"
echo "   3. Update layout.tsx metadata"
echo "   4. Update capacitor.config.ts"

