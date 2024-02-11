# Ava PLS

Air-gapped Virtual Assistant / Personal Language Server\
[Website](https://avapls.com) | [Twitter](https://twitter.com/cztomsik) | [Discord](https://discord.gg/C47qUJPkkf)

https://github.com/cztomsik/ava/assets/3526922/790dd1a2-5e59-4a63-a05a-f255b5677269

https://github.com/cztomsik/ava/assets/3526922/22dce230-3d91-476d-83b7-22ddcc41fb87

https://github.com/cztomsik/ava/assets/3526922/64f16a97-6575-4006-bb81-c46e1f5cfcaa

https://github.com/cztomsik/ava/assets/3526922/1dcf38a5-cfc9-4b20-9f2e-deb15145d964

## Tech stack

- Zig, C++, Swift UI, SQLite
- Preact, Preact Signals, Twind

## Local Development

Make sure you have:

- [Latest Zig](https://ziglang.org/download/)
- [Node.js 20.5.1](https://nodejs.org/)
  - only needed for fetching dependencies
- Xcode (for macOS)
- pkg-config (`brew install pkg-config`)

```bash
npm install
npm run watch
zig build && ./zig-out/bin/ava_aarch64 # or ./zig-out/bin/ava_x86_64
```

## Headless mode (works on Linux!)

It is now possible to build Ava in headless mode. This will start a server
and you can connect to it using a web browser.

This is useful if you want to deploy Ava somewhere and connect to it remotely,
or if you are using Linux, because we don't have Qt/GTK support yet.

```bash
zig build -Dheadless=true && ./zig-out/bin/ava_aarch64 # or ./zig-out/bin/ava_x86_64
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

## License

MIT

## Contributing

Bug reports and pull requests are welcome but if you want to do a bigger change, please open an issue first to discuss it.
