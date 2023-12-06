# Ava PLS

Air-gapped Virtual Assistant / Personal language server

![Screenshot](./website/screenshot.png)

## Tech stack

- Zig, C++, Swift UI, SQLite
- Preact, Preact Signals, Twind

## Local Development

Make sure you have:

- [0.12.0-dev.1769+bf5ab5451](https://ziglang.org/download/)
- [Node.js 20.5.1](https://nodejs.org/)
- Xcode (for macOS)
- pkg-config (`brew install pkg-config`)

```bash
npm install
npm run watch
zig build run
```

## macOS 12.6+ (Monterey)

Xcode is needed because of Swift UI

```
sudo xcode-select -switch /Applications/Xcode.app
```

## Production build

```bash
npm install
npm run build
zig build -Doptimize=ReleaseSafe -Dcpu=native
```
