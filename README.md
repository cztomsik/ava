# Ava

Air-gapped Virtual Assistant

## Tech stack

- Bun, SQLite, Zig, C++
- Preact, Preact Router, Preact Signals, Bootstrap 5, Goober

## Local Development

Make sure you have:

- [Bun](https://bun.sh)
- [Zig](https://ziglang.org/download/)
- Xcode developer tools
- pkg-config (`brew install pkg-config`)
- Download model from https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGML/blob/main/wizardlm-13b-v1.2.ggmlv3.q4_0.bin

```bash
bun install
./llama.cpp/server -m ./wizardlm-13b-v1.2.ggmlv3.q4_0.bin -c 4096 -ngl 1
bun run dev
```

## Production build

```bash
bun build
./ava
```
