#!/bin/bash

echo "Building Gorph WASM module..."

# Set environment for WASM
export GOOS=js
export GOARCH=wasm

# Build the WASM module
go build -o ../frontend/gorph-app/public/gorph.wasm main.go

# Copy the WASM exec helper
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ../frontend/gorph-app/public/

echo "WASM build complete!"
echo "Output files:"
echo "  - ../frontend/gorph-app/public/gorph.wasm"
echo "  - ../frontend/gorph-app/public/wasm_exec.js" 