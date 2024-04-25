---
title: Development
nav_order: 3
---

# Local Development

Make sure you have:

- [Zig 0.12.0](https://ziglang.org/download/)
- [Node.js 21.7.3](https://nodejs.org/)
  - only needed for fetching dependencies & running tests
- Xcode (for macOS)
- pkg-config (`brew install pkg-config`)

```bash
npm install
npm run watch
zig build && ./zig-out/bin/ava_aarch64 # or ./zig-out/bin/ava_x86_64
```

## macOS 12.6+ (Monterey)

Xcode is needed because of Swift UI

```
sudo xcode-select -switch /Applications/Xcode.app
```

## Production build

```bash
./src/macos/create_dmg.sh
```

Or on Windows:

```bash
./src/windows/create_zip.sh
```
