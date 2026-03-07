# refs/ — Reference Material

This directory contains external reference material used during development.

## Angular Docs (`angular/`)

The official Angular repository, configured as a **shallow submodule with sparse checkout** so only `adev/src/content/` (the documentation source) is materialized on disk.

### First-time setup

After cloning this repo:

```bash
git submodule update --init --depth 1
cd refs/angular
git sparse-checkout init --cone
git sparse-checkout set adev/src/content
```

### Updating to latest docs

```bash
cd refs/angular
git fetch --depth 1 origin main
git checkout FETCH_HEAD
cd ../..
git add refs/angular
git commit -m "Update Angular docs submodule"
```

### Pinning to a release

```bash
cd refs/angular
git fetch --depth 1 origin refs/tags/19.0.0
git checkout FETCH_HEAD
cd ../..
git add refs/angular
git commit -m "Pin Angular docs to v19.0.0"
```

### What's on disk

Only `adev/src/content/` is checked out. This includes:
- `guide/` — Conceptual guides (signals, routing, forms, DI, etc.)
- `tutorials/` — Step-by-step tutorials
- `api/` — API reference docs (if present)
- `examples/` — Code examples

Everything else (packages, tools, build infrastructure) is excluded via sparse checkout.
