---
title: Headless mode
nav_order: 2
---

# Headless mode (works on Linux!)

It is now possible to build Ava in headless mode. This will start a server
and you can connect to it using a web browser.

This is useful if you want to deploy Ava somewhere and connect to it remotely,
or if you are using Linux, because we don't have Qt/GTK support yet.

You can pick the latest version from the [GitHub
Actions](https://github.com/cztomsik/ava/actions) page or you can build it
yourself.

```bash
zig build -Dheadless=true && ./zig-out/bin/ava_aarch64 # or ./zig-out/bin/ava_x86_64
```
