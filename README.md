# Ava

TBD

## Tech stack

- Node.js, Zig (TODO), C++, PostgreSQL (TODO)
- Bootstrap 5
- Preact/Compat, Preact Router, Preact Signals

## Code Conventions

- package.json shared for both client and server

## Preparation

- Download model from https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGML/blob/main/wizardlm-13b-v1.2.ggmlv3.q4_0.bin
- Download Xcode developer tools

## Local Development

```bash
npm install
./llama.cpp/server -m ./wizardlm-13b-v1.2.ggmlv3.q4_0.bin -c 4096 -ngl 1
npm run dev
```

## Production Build (TODO)

```bash
# build
npm install
npm run build

# configure
touch dist/.env

# run
node dist/server.js
```
