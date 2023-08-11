# Ava

Air-gapped Virtual Assistant

## Tech stack

- Bun, SQLite, Zig, C++
- Preact, Preact Router, Preact Signals, Bootstrap 5, Goober

## Local Development

Make sure you have:

- [Zig](https://ziglang.org/download/)
- [Node.js](https://nodejs.org/)
- Xcode developer tools
- pkg-config (`brew install pkg-config`)
- Download model from https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGML/blob/main/wizardlm-13b-v1.2.ggmlv3.q4_0.bin

```bash
npm install
npm run watch
zig build run
```

## Production build

```bash
npm install
npm run build -- --minify
zig build -Doptimize=ReleaseSafe -Dcpu=native
```
