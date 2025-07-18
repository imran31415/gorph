# Gorph

Infrastructure visualization tool that converts YAML definitions to Graphviz diagrams.

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
# Start the cross-platform web app
cd web/frontend/gorph-app
npm install
npm run dev

# Open http://localhost:19006
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
