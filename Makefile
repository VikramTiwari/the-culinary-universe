# Culinary Vector Math - Developer Operations
# This Makefile injects the target-aware Rustup compiler binary path to resolve conflicts
# with standalone Homebrew installations on the developer's system.

SHELL := /bin/bash

# Prepend the Rustup toolchain binary directory to the system PATH
export PATH := /Users/vik/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$(PATH)

.PHONY: help install wasm-build data-gen dev build clean deploy deploy-firebase

# Default target
help:
	@echo "========================================================================"
	@echo " Culinary Vector Math - Build System"
	@echo "========================================================================"
	@echo "Available commands:"
	@echo "  make install     - Install all JavaScript/NPM dependencies"
	@echo "  make wasm-build   - Compile optimized Rust WASM engine to src/"
	@echo "  make data-gen    - Download and process real 1,790-item Epicure core dataset"
	@echo "  make dev         - Auto-compile WASM and start the Vite local dev server"
	@echo "  make build       - Compile WASM and bundle production assets"
	@echo "  make clean       - Remove generated build chunks and packages"
	@echo "========================================================================"

# Install NPM packages
install:
	npm install

# Compile the Rust WebAssembly Engine
wasm-build:
	wasm-pack build ./wasm-engine --target web --out-dir ../src/wasm-engine/pkg

# Seed dataset flat binary and JSON metadata
data-gen:
	.venv/bin/python3 scripts/download-dataset.py

# Launch local dev server (compiling WASM and generating dataset if missing)
dev: data-gen wasm-build
	npx vite

# Verify and bundle production assets
build: data-gen wasm-build
	npx tsc && npx vite build

# Deploy compiled production bundle to GitHub Pages
deploy: build
	npx -y gh-pages -d dist

# Deploy compiled production bundle to Firebase Hosting
deploy-firebase: build
	npx -y firebase-tools@latest deploy --only hosting

# Clean temporary packages and bundle products
clean:
	rm -rf dist/
	rm -rf src/wasm-engine/pkg/
	rm -rf wasm-engine/target/
	@echo "Clean completed."
