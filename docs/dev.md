---
title: Development
nav_order: 3
---

# Local Development

Make sure you have:

- [Zig 0.14.0](https://ziglang.org/download/)
- [Node.js 21.7.3](https://nodejs.org/)
  - only needed for fetching dependencies & running tests
- Xcode (for macOS)
- pkg-config (`brew install pkg-config`)

```bash
npm install
npm run watch
zig build run
```
