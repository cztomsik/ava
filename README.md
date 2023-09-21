# Ava

Air-gapped Virtual Assistant / Personal language server

## Tech stack

- Zig, C++, Objective-C, SQLite
- Preact, Preact Router, Preact Signals, Bootstrap 5, Goober

## Local Development

Make sure you have:

- [Zig 0.11.0](https://ziglang.org/download/)
- [Node.js 20.5.1](https://nodejs.org/)
- Xcode (for macOS)
- pkg-config (`brew install pkg-config`)

```bash
npm install
npm run watch
zig build run
```

## macOS 12.6+ (Monterey)

Xcode is needed (for ibtool)

```
sudo xcode-select -switch /Applications/Xcode.app
```

## Production build

```bash
npm install
npm run build
zig build -Doptimize=ReleaseSafe -Dcpu=native
```
