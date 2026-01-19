#!/bin/bash

# Variables
APP_NAME="Ava"
ZIG_OUT="$(dirname "$0")/../zig-out"
APP_PATH="$ZIG_OUT/${APP_NAME}.app"
DMG_TMP_PATH="$ZIG_OUT/${APP_NAME}_tmp.dmg"
DMG_FINAL_PATH="$ZIG_OUT/${APP_NAME}_$(date +%Y-%m-%d).dmg"

# Parse arguments
SKIP_BUILD=false
NOTARIZE=false
for arg in "$@"; do
    case $arg in
        --skip-build) SKIP_BUILD=true ;;
        --notarize) NOTARIZE=true ;;
    esac
done

if [ "$SKIP_BUILD" = false ]; then
    # Clean
    rm -rf "$ZIG_OUT"

    # Build JS, x86_64, aarch64, and universal binary
    npm run build && zig build -Doptimize=ReleaseSafe

    if [ $? -ne 0 ]; then
        echo "Build failed"
        exit 1;
    fi
fi

# Verify binary exists
if [ ! -f "$ZIG_OUT/bin/ava" ]; then
    echo "Error: $ZIG_OUT/bin/ava not found. Run without --skip-build or build first."
    exit 1
fi

mkdir -p "${APP_PATH}/Contents/MacOS" \
&& mkdir -p "${APP_PATH}/Contents/Resources" \
&& cp "$ZIG_OUT/bin/ava" "${APP_PATH}/Contents/MacOS/" \
&& cp "$ZIG_OUT/bin/"*.dylib "${APP_PATH}/Contents/MacOS/" \
&& cp ./src/app/favicon.ico "${APP_PATH}/Contents/Resources/"

if [ $? -ne 0 ]; then
    echo "Copy failed"
    exit 1;
fi

cat << EOF > "${APP_PATH}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleExecutable</key>
	<string>ava</string>
	<key>CFBundleIdentifier</key>
	<string>com.avapls.Ava-PLS</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>Ava PLS</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleSupportedPlatforms</key>
	<array>
		<string>MacOSX</string>
	</array>
	<key>CFBundleVersion</key>
	<string>1</string>
  <key>CFBundleIconFile</key>
  <string>favicon.ico</string>
	<key>NSMainNibFile</key>
	<string>MainMenu</string>
	<key>NSPrincipalClass</key>
	<string>NSApplication</string>
</dict>
</plist>
EOF

# Sign app (ad-hoc by default, set CODESIGN_IDENTITY env var for proper signing)
CODESIGN_IDENTITY="${CODESIGN_IDENTITY:--}"
if [ "$CODESIGN_IDENTITY" = "-" ]; then
    echo "Using ad-hoc code signing (set CODESIGN_IDENTITY for proper signing)"
    codesign -fs - --deep "${APP_PATH}"
else
    echo "Signing with identity: $CODESIGN_IDENTITY"
    codesign -fs "$CODESIGN_IDENTITY" --deep --options=runtime --timestamp "${APP_PATH}"
fi

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

# Notarize (if run with --notarize and NOTARIZE_PROFILE is set)
if [ "$NOTARIZE" = false ]; then exit 0; fi
if [ -z "$NOTARIZE_PROFILE" ]; then
    echo "Error: NOTARIZE_PROFILE environment variable not set"
    echo "Create a profile with: xcrun notarytool store-credentials"
    exit 1
fi
xcrun notarytool submit --wait --keychain-profile "$NOTARIZE_PROFILE" "${DMG_FINAL_PATH}"
