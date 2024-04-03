#!/bin/bash

# Variables
APP_NAME="Ava"
ZIG_OUT="$(dirname "$0")/../../zig-out"
APP_PATH="$ZIG_OUT/${APP_NAME}.app"
DMG_TMP_PATH="$ZIG_OUT/${APP_NAME}_tmp.dmg"
DMG_FINAL_PATH="$ZIG_OUT/${APP_NAME}_$(date +%Y-%m-%d).dmg"

# Clean
rm -rf "$ZIG_OUT"

# Build JS, x86_64, aarch64, and universal binary
npm run build \
&& zig build -Doptimize=ReleaseSafe -Dtarget=x86_64-macos.12.6 \
&& zig build -Doptimize=ReleaseSafe -Dtarget=aarch64-macos.12.6 \
&& lipo -create "$ZIG_OUT/bin/ava_aarch64" "$ZIG_OUT/bin/ava_x86_64" -output "$ZIG_OUT/bin/ava"

if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1;
fi

mkdir -p "${APP_PATH}/Contents/MacOS" \
&& mkdir -p "${APP_PATH}/Contents/Resources" \
&& cp ./src/macos/Info.plist "${APP_PATH}/Contents/" \
&& cp "$ZIG_OUT/bin/ava" "${APP_PATH}/Contents/MacOS/" \
&& cp ./src/app/favicon.ico ./llama.cpp/ggml-metal.metal ./llama.cpp/ggml-common.h "${APP_PATH}/Contents/Resources/"

if [ $? -ne 0 ]; then
    echo "Copy failed"
    exit 1;
fi

# Sign app
# Note it still needs to be notarized
codesign -fs "Developer ID Application: KAMIL TOMSIK (RYT4H286GA)" --deep --options=runtime --timestamp "${APP_PATH}"

if [ $? -ne 0 ]; then
    echo "Signing failed"
    exit 1;
fi

# Create temp DMG and perform some customizations
# Adapted from https://stackoverflow.com/questions/96882/how-do-i-create-a-nice-looking-dmg-for-mac-os-x-using-command-line-tools
hdiutil create -srcfolder "${APP_PATH}" -volname "${APP_NAME}" -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW -size 512000k "${DMG_TMP_PATH}"
MOUNT_RESULT=$(hdiutil attach -readwrite -noverify -noautoopen "${DMG_TMP_PATH}")
DEVICE_PATH=$(echo "${MOUNT_RESULT}" | egrep '^/dev/' | sed 1q | awk '{print $1}')
echo '
    tell application "Finder"
        tell disk "'${APP_NAME}'"
            open
            set current view of container window to icon view
            set the bounds of container window to {400, 100, 885, 430}
            set theViewOptions to the icon view options of container window
            set arrangement of theViewOptions to not arranged
            set icon size of theViewOptions to 72
            make new alias file at container window to POSIX file "/Applications" with properties {name:"Applications"}
            set position of item "'${APP_NAME}'" of container window to {100, 100}
            set position of item "Applications" of container window to {375, 100}
            update without registering applications
            delay 5
            close
        end tell
    end tell
' | osascript
hdiutil detach "${DEVICE_PATH}"

# Create final DMG
hdiutil convert "${DMG_TMP_PATH}" -format UDZO -imagekey zlib-level=9 -o "${DMG_FINAL_PATH}"
rm "${DMG_TMP_PATH}"

echo "DMG created at ${DMG_FINAL_PATH}"

# Notarize (if run with --notarize)
if [ "$1" != "--notarize" ]; then exit 0; fi
xcrun notarytool submit --wait --keychain-profile "KAMIL TOMSIK" "${DMG_FINAL_PATH}"
