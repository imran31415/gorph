# Gorph

Infrastructure visualization tool that converts YAML definitions to Graphviz diagrams.

## 🌐 Live Demo

**Try it now**: [gorph.ai](https://gorph.ai)

The live version is fully functional and ready to use. Create infrastructure diagrams by writing YAML and see them rendered instantly in your browser.
<img width="1505" height="899" alt="image" src="https://github.com/user-attachments/assets/92159075-0344-4366-9a85-50c8277dd59a" />


## 🚀 Quick Start

### CLI Tool
```bash
# Build the CLI tool
go build -o gorph main.go

# Generate PNG diagram directly (requires Graphviz)
./gorph -input example_input/microservices.yml -png microservices.png

# Generate both DOT and PNG
./gorph -input example_input/webapp.yml -output webapp.dot -png webapp.png
```

### Web Application
```bash
# Install dependencies
make setup

# Start the cross-platform web app
make web-frontend

# Open http://localhost:8081
```

## 📱 Applications

### 1. **CLI Tool** - Production Ready
- **Fast Processing** - Native Go performance
- **Multiple Formats** - DOT, PNG, SVG output  
- **Scripting Friendly** - Pipe-compatible design
- **CI/CD Integration** - Perfect for automation

### 2. **Web Application** - Interactive & Visual
- **3-Pane Interface** - YAML editor, DOT output, live diagram
- **Cross-Platform** - Web, iOS, Android via React Native/Expo
- **Real-Time Rendering** - Instant feedback with WASM backend
- **Template Library** - Quick start with predefined architectures
- **WebAssembly Backend** - Go code compiled to WASM for client-side processing

### 3. **Protobuf API** - Enterprise Integration
- **Strongly Typed** - gRPC service definitions
- **CRUD Operations** - Full infrastructure management
- **Multi-Language** - Generate clients for any language
- **Validation** - Built-in error reporting

## 🎯 Examples

The `example_input/` directory contains several example architectures:

- **`simple.yml`** - Minimal 3-component architecture with different status states
- **`webapp.yml`** - Classic web application with CDN, load balancer, and database
- **`microservices.yml`** - Complex microservices architecture with message queues
- **`data-pipeline.yml`** - Data processing pipeline with ETL jobs and ML components
- **`infra.yml`** - Full production infrastructure example
- **`deploy.yml`** - CI/CD deployment pipeline

Pre-generated DOT and PNG files for all examples are available in `example_output/`.

### Example Outputs
<!-- TODO: Add screenshots of generated diagrams for each example architecture -->

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Tool      │    │   Web App        │    │   Protobuf API  │
│                 │    │                  │    │                 │
│ • Native Go     │    │ • React Native   │    │ • gRPC Services │
│ • Fast Pipeline │    │ • WASM Backend   │    │ • Type Safety   │
│ • Automation   │◄────┤ • Visual Editor  │    │ • Multi-Language│
│ • CI/CD         │    │ • Cross-Platform │    │ • Enterprise    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                            ┌──────▼──────┐
                            │   Shared    │
                            │   Core      │
                            │             │
                            │ • YAML      │
                            │ • DOT Gen   │
                            │ • Styling   │
                            │ • Validation│
                            └─────────────┘
```

## ⚡ WebAssembly (WASM) Implementation

Gorph uses WebAssembly to bring native Go performance to the browser. Here's how it works:

### **WASM Backend Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   WASM Bridge   │    │   Go WASM       │
│   Frontend      │    │                 │    │   Module        │
│                 │    │ • Runtime Load  │    │                 │
│ • YAML Editor   │◄───┤ • Base64 Encode │◄───┤ • YAML Parser  │
│ • Real-time     │    │ • Error Handle  │    │ • DOT Generator │
│ • Validation    │    │ • Mobile Bridge │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **How WASM Works in Gorph**

1. **Go Code Compilation**: The core YAML processing logic is written in Go and compiled to WebAssembly using `GOOS=js GOARCH=wasm`

2. **Client-Side Processing**: Instead of sending YAML to a server, the WASM module runs directly in the browser, providing:
   - **Instant Feedback**: No network latency for validation and DOT generation
   - **Privacy**: YAML content never leaves the user's device
   - **Offline Capability**: Works without internet connection

3. **Cross-Platform Bridge**: 
   - **Web**: Direct WASM execution via JavaScript
   - **Mobile**: WebView bridge for iOS/Android compatibility
   - **Runtime Loading**: WASM module loaded dynamically from base64-encoded data

4. **Performance Benefits**:
   - **Native Speed**: Go performance in the browser
   - **Small Bundle**: ~3.8MB WASM module
   - **Shared Logic**: Same codebase as CLI tool

### **WASM Functions**
The Go WASM module provides these functions:
- `yamlToDot(yaml: string)`: Convert YAML to DOT format
- `validateYaml(yaml: string)`: Validate YAML syntax and structure
- `getTemplates()`: Retrieve built-in template library

## 🎨 Web Application Features

### Desktop Experience (Landscape)
```
┌─────────────┬─────────────┐
│             │ DOT Output  │
│ YAML Editor ├─────────────┤
│             │ Live        │
│             │ Diagram     │
└─────────────┴─────────────┘
```

### Mobile Experience (Portrait)
```
┌─────────────────────────┐
│ [YAML] [DOT] [DIAGRAM] │ ← Tabs
├─────────────────────────┤
│                         │
│    Active Tab Content   │
│                         │
│                         │
└─────────────────────────┘
```

## 🎛️ Visual Builder

Gorph now includes a **visual Builder** that makes it easy to create infrastructure diagrams without knowing the YAML syntax:

### Builder Features:
- **Visual Entity Creation**: Add infrastructure components using forms and dropdowns
- **Smart Connection Builder**: Create relationships between entities with validation
- **Real-time YAML Generation**: Changes in the Builder automatically update the YAML
- **Template Library**: Start with predefined templates for common patterns
- **Live Validation**: Get immediate feedback on errors and suggestions

### How to Use:
1. Click the **"BUILDER"** tab in the interface
2. Use the **"Entities"** section to add infrastructure components
3. Use the **"Connections"** section to define relationships
4. Watch the YAML update in real-time
5. Switch to **"DIAGRAM"** to see your visualization

### Available Categories:
- **USER_FACING**: Web browsers, mobile apps, APIs
- **FRONTEND**: React apps, static sites, web servers
- **BACKEND**: APIs, microservices, server applications
- **DATABASE**: PostgreSQL, Redis, MongoDB, etc.
- **NETWORK**: Load balancers, CDNs, API gateways
- **INFRASTRUCTURE**: Kubernetes, Docker, cloud services
- **CI/CD**: Jenkins, GitHub Actions, deployment tools
- And many more...

### Builder Interface
```
┌─────────────────────────────────────┐
│ 🎛️ Builder Mode                    │
├─────────────────────────────────────┤
│ ➕ Add Entity                       │
│ 🔗 Add Connection                   │
│ 📋 Templates                        │
│ ⚙️  Settings                        │
└─────────────────────────────────────┘
```

## 📚 YAML Schema Documentation

For advanced users or custom configurations, see the complete [YAML Schema Documentation](YAML_SCHEMA.md) which includes:

- **Complete field reference** with examples
- **Available categories and connection types**
- **Best practices** for complex diagrams
- **Validation rules** and troubleshooting
- **Advanced features** like custom attributes and tags

## 📸 Screenshots

### Desktop Interface
<img width="1505" height="899" alt="image" src="https://github.com/user-attachments/assets/dc3b0c6f-ff52-4a01-88b6-83a4f030d469" />

### Mobile Interface  
<img width="360" height="734" alt="image" src="https://github.com/user-attachments/assets/007ac4ee-3979-4109-8b15-12ff7ff312bd" />
<img width="390" height="738" alt="image" src="https://github.com/user-attachments/assets/944231ef-3043-4218-a4ec-d9d5b2c3c923" />


### Example Diagrams
<img width="1506" height="896" alt="image" src="https://github.com/user-attachments/assets/94269937-36d0-4693-8838-41652291060c" />

### Template Selection
<img width="868" height="790" alt="image" src="https://github.com/user-attachments/assets/432ea9b5-ffc3-4638-9aa2-1d32d0285f92" />

## 📊 Protobuf API

Gorph includes a comprehensive protobuf API specification for building integrations, web UIs, and other tools. The API provides:

- **Strongly-typed data models** for entities, connections, and infrastructure
- **gRPC service definitions** with full CRUD operations
- **Built-in validation** and error reporting
- **Diagram generation** in multiple formats (DOT, PNG, SVG, PDF)
- **YAML import/export** for compatibility with existing workflows

See [`api/README.md`](api/README.md) for complete API documentation.

### Quick API Example

```go
// Create an entity using the protobuf API
entity := &gorph.Entity{
    Id:          "web-server",
    Category:    gorph.Category_CATEGORY_FRONTEND,
    Description: "Nginx web server",
    Status:      gorph.Status_STATUS_HEALTHY,
    Owner:       "frontend-team",
    Environment: "production",
}
```

## 🔧 Development

```bash
# Complete development setup
make dev

# Generate protobuf code
make proto

# Build CLI tool
make build

# Generate all examples
make examples

# Show available targets
make help
```

## 📁 Project Structure

```
gorph/
├── 📄 main.go                  # CLI application
├── 📄 style.yml               # Visual styling config
├── 📁 example_input/          # Example YAML files
├── 📁 example_output/         # Generated diagrams
├── 📁 api/                    # Protobuf API specification
│   ├── 📄 gorph.proto        # Protocol buffer definitions
│   ├── 📄 README.md          # API documentation  
│   └── 📄 SPECIFICATION.md   # Technical specification
└── 📁 web/                   # Web application
    ├── 📁 backend/           # Go WASM backend
    │   ├── 📄 main.go       # WASM module
    │   └── 📄 build.sh      # Build script
    └── 📁 frontend/gorph-app/ # React Native frontend
        ├── 📁 src/components/ # React components
        ├── 📁 public/        # WASM files
        └── 📄 App.tsx        # Main application
```

## 🌐 Deployment Options

### CLI Tool
- **Direct Binary** - Single executable
- **Package Managers** - Homebrew, apt, etc.
- **Container Images** - Docker/Kubernetes

### Web Application  
- **Static Hosting** - Netlify, Vercel, GitHub Pages
- **Mobile Apps** - iOS App Store, Google Play
- **Self-Hosted** - Any web server

### API Services
- **gRPC Servers** - Cloud Run, Kubernetes
- **Serverless** - AWS Lambda, Vercel Functions
- **Enterprise** - On-premise deployment

## 🎯 Use Cases

### 📋 **Documentation**
- **Architecture Reviews** - Visual system overviews
- **Onboarding** - New team member orientation  
- **Compliance** - System documentation requirements

### 🔄 **Development Workflow**
- **Design Phase** - Architecture planning and validation
- **Code Reviews** - Infrastructure change visualization
- **Deployment** - Pipeline and environment documentation

### 📊 **Operations**
- **Incident Response** - System relationship mapping
- **Capacity Planning** - Resource dependency analysis
- **Monitoring** - Service health visualization

### 🏢 **Enterprise Integration**
- **CMDB Integration** - Configuration management
- **Service Catalog** - Self-service portals
- **Cost Analysis** - Resource ownership tracking

## 📜 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Documentation**: See individual README files in each directory
- **Examples**: Check `example_input/` for reference implementations
- **API Reference**: See `api/README.md` for protobuf documentation
- **Web App Guide**: See `web/README.md` for development setup
