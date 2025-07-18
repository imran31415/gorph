.PHONY: proto build test clean clean-web examples help run-cli serve-grpc build-wasm web-frontend web-dev web-setup setup dev-full

# Go binary name
BINARY_NAME=gorph
API_DIR=api
PROTO_DIR=$(API_DIR)
GO_OUT_DIR=api/v1

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Protobuf generation
proto: ## Generate Go code from protobuf
	@echo "Generating Go code from protobuf..."
	@mkdir -p $(GO_OUT_DIR)
	protoc \
		--go_out=$(GO_OUT_DIR) \
		--go_opt=paths=source_relative \
		--go-grpc_out=$(GO_OUT_DIR) \
		--go-grpc_opt=paths=source_relative \
		--proto_path=$(PROTO_DIR) \
		$(PROTO_DIR)/gorph.proto

# Build the CLI binary
build: ## Build the CLI binary
	@echo "Building $(BINARY_NAME)..."
	go build -o $(BINARY_NAME) main.go

# Generate all examples
examples: build ## Generate all example outputs (DOT and PNG)
	@echo "Generating example outputs..."
	@mkdir -p example_output
	@for file in example_input/*.yml; do \
		base=$$(basename "$$file" .yml); \
		echo "Processing $$base..."; \
		./$(BINARY_NAME) -input "$$file" -output "example_output/$$base.dot" -png "example_output/$$base.png"; \
	done

# Run tests
test: ## Run Go tests
	go test ./... -v

# Clean build artifacts
clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -f $(BINARY_NAME)
	rm -rf $(GO_OUT_DIR)

clean-web: ## Clean web application build artifacts
	@echo "Cleaning web application..."
	cd web/frontend/gorph-app && rm -rf node_modules yarn.lock
	rm -f web/frontend/gorph-app/public/gorph.wasm web/frontend/gorph-app/public/wasm_exec.js

# Development setup
deps: ## Install development dependencies
	@echo "Installing dependencies..."
	go mod tidy
	@echo "Installing protoc plugins..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Validate protobuf
validate-proto: ## Validate protobuf syntax
	@echo "Validating protobuf..."
	protoc --proto_path=$(PROTO_DIR) --descriptor_set_out=/dev/null $(PROTO_DIR)/gorph.proto

# Backend commands
run-cli: build ## Run the CLI backend with example
	@echo "Running CLI backend with simple example..."
	./$(BINARY_NAME) -input example_input/simple.yml

serve-grpc: proto ## Start gRPC API server (if implemented)
	@echo "gRPC server not yet implemented. Use CLI or web backends."

# Web application commands
build-wasm: ## Build the WASM backend
	@echo "Building WASM backend..."
	cd web/backend && ./build.sh

web-frontend: ## Start the frontend development server
	@echo "Starting frontend development server..."
	cd web/frontend/gorph-app && yarn web

web-dev: build-wasm ## Build WASM and start frontend (run in separate terminals)
	@echo "WASM built successfully!"
	@echo "Now run 'make web-frontend' in another terminal to start the frontend"

web-setup: ## Install web application dependencies
	@echo "Installing web application dependencies..."
	cd web/frontend/gorph-app && yarn install --ignore-engines

# Development workflow
dev: clean deps validate-proto proto build examples ## Complete development setup and build

setup: deps web-setup ## Install all dependencies (CLI and web)
	@echo "All dependencies installed!"

dev-full: setup build-wasm ## Complete setup including web application
	@echo "Full development environment ready!"
	@echo ""
	@echo "Available commands:"
	@echo "  make web-frontend  - Start frontend development server"
	@echo "  make build-wasm    - Rebuild WASM backend"
	@echo "  make examples      - Generate CLI examples" 