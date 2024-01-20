#!/bin/sh

# This script downloads the dependencies for the Windows build.
# It is called automatically by the `zig build` command.

ZIG_OUT="$(dirname "$0")/../../zig-out"
WEBVIEW_LOADER="$ZIG_OUT/webview2_loader"
SQLITE="$ZIG_OUT/sqlite"

if (test -d "$WEBVIEW_LOADER"); then
  echo "WebView2Loader found in $WEBVIEW_LOADER"
else
  echo "Downloading WebView2Loader to $WEBVIEW_LOADER"
  mkdir -p $WEBVIEW_LOADER
  curl -sSL "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2" | tar -xf - -C $WEBVIEW_LOADER --strip-components=2 "build/native/include" "build/native/x64"
fi
