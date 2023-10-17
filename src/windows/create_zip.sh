#!/bin/sh

ZIG_OUT="$(dirname "$0")/../../zig-out"
ZIP_FILE="$ZIG_OUT/ava_x86_64_$(date +%Y-%m-%d).zip"

# Clean
rm -rf "$ZIG_OUT"

# Build JS, x86_64
npm run build \
&& zig build -Doptimize=ReleaseSafe -Dtarget=x86_64-windows

if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1;
fi

# Create zip
zip -j -9 "$ZIP_FILE" "$ZIG_OUT/bin/ava_x86_64.exe" "$ZIG_OUT/webview2_loader/x64/WebView2Loader.dll"

if [ $? -ne 0 ]; then
    echo "Zip failed"
    exit 1;
fi

echo "Created $ZIP_FILE"
