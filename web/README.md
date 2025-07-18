# Gorph Web Application

A cross-platform React Native/Expo application for creating infrastructure diagrams with real-time visualization.

## Features

### 🎯 **3-Pane Interface**
- **YAML Editor** - Write infrastructure definitions with syntax highlighting and templates
- **DOT Output** - View generated Graphviz DOT notation with line numbers
- **Diagram Viewer** - Live rendered diagrams using WASM Graphviz

### 📱 **Cross-Platform**
- **Web** - Full desktop experience with 3-pane layout
- **Mobile** - Responsive tabbed interface for iOS and Android
- **Native Performance** - Go WASM backend for fast processing

### ⚡ **Real-Time Processing**
- **Instant Feedback** - YAML changes immediately update DOT and diagram
- **Built-in Validation** - Error highlighting and detailed validation messages
- **Template Library** - Quick start with predefined architecture patterns

### 🎨 **Modern UI**
- **Responsive Design** - Adapts to screen size and orientation
- **Touch-Friendly** - Optimized for mobile interaction
- **Professional Styling** - Clean, modern interface with proper typography

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Go WASM        │    │   @hpcc-js/wasm │
│   Frontend      │◄──►│   Backend        │◄──►│   Graphviz      │
│                 │    │                  │    │                 │
│ • YAML Editor   │    │ • YAML Parser    │    │ • SVG Rendering │
│ • DOT Display   │    │ • DOT Generator  │    │ • Layout Engine │
│ • Diagram View  │    │ • Validation     │    │ • Export        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+
- Go 1.23+
- Expo CLI

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gorph/web

# Install frontend dependencies
cd frontend/gorph-app
npm install

# Build WASM backend
npm run build:wasm

# Start development server
npm run web
```

### Development Workflow

```bash
# Start development with WASM rebuild
npm run dev

# Individual commands
npm run build:wasm    # Build Go WASM module
npm run web          # Start web development
npm run ios          # Start iOS development
npm run android      # Start Android development
```

## Usage

### Web Application
1. Open http://localhost:19006 in your browser
2. Wait for WASM module to load
3. Select a template or write custom YAML
4. View real-time DOT generation and diagram rendering

### Mobile Application
1. Install Expo Go app on your device
2. Scan QR code from development server
3. Use tabbed interface to switch between panes
4. Templates and validation work the same as web

## Templates

### Available Templates
- **Simple** - Basic 3-component architecture
- **Web App** - Frontend + Backend + Database
- **Microservices** - Complex service mesh with message queues

### Custom Templates
Add new templates by editing the WASM backend:
```go
// In web/backend/main.go
templates := map[string]string{
    "my-template": `entities:
  - id: MyService
    category: BACKEND
    description: "My custom service"
    # ... rest of definition
`,
}
```

## YAML Schema

### Entity Definition
```yaml
entities:
  - id: ServiceName           # Required: Unique identifier
    category: BACKEND          # Required: Entity category
    description: "Description" # Required: Human-readable description
    status: healthy           # Required: healthy | degraded | down
    owner: team-name          # Required: Responsible team
    environment: production   # Optional: Environment name
    tags: [critical]          # Optional: Array of tags
    attributes:               # Optional: Key-value metadata
      language: Go
      version: "1.19"
    deployment_config:        # Optional: Deployment details
      replicas: 3
      image: "service:v1.0"
    shape: rectangle          # Optional: Visual shape hint
    icon: server             # Optional: Icon identifier
```

### Connection Definition
```yaml
connections:
  - from: SourceService      # Required: Source entity ID
    to: TargetService        # Required: Target entity ID
    type: HTTP_Request       # Required: Connection type
```

### Supported Categories
- `USER_FACING` - User interfaces, clients
- `FRONTEND` - Web servers, static sites  
- `BACKEND` - APIs, microservices
- `DATABASE` - Databases, caches
- `NETWORK` - Load balancers, gateways
- `INTEGRATION` - External services
- `INFRASTRUCTURE` - Orchestration, cloud platforms
- `INTERNAL` - Monitoring, logging

### Supported Connection Types
- `HTTP_Request` - HTTP/HTTPS requests
- `API_Call` - API calls (styled as dashed orange)
- `DB_Connection` - Database connections (blue)
- `Service_Call` - Service-to-service calls
- `User_Interaction` - User interactions
- `Internal_API` - Internal monitoring (dotted gray)

## File Structure

```
web/
├── backend/                 # Go WASM backend
│   ├── main.go             # WASM module with Gorph logic
│   ├── go.mod              # Go dependencies
│   └── build.sh            # WASM build script
└── frontend/gorph-app/     # React Native frontend
    ├── src/components/     # React components
    │   ├── Header.tsx      # App header
    │   ├── YamlEditor.tsx  # YAML input editor
    │   ├── DotOutput.tsx   # DOT notation display
    │   ├── DiagramViewer.tsx # SVG diagram viewer
    │   └── LoadingScreen.tsx # Loading screen
    ├── public/             # Static assets
    │   ├── gorph.wasm      # Compiled WASM module
    │   ├── wasm_exec.js    # Go WASM runtime
    │   └── index.html      # Custom HTML with WASM loader
    ├── App.tsx             # Main app component
    └── package.json        # Dependencies and scripts
```

## API Integration

The web app uses the same Go logic as the CLI tool, compiled to WASM:

```javascript
// Available WASM functions
window.yamlToDot(yamlString)      // Convert YAML to DOT
window.validateYaml(yamlString)   // Validate YAML structure  
window.getTemplates()             // Get template library
```

For full API integration, see the [protobuf specification](../api/README.md).

## Deployment

### Web Deployment
```bash
# Build for production
npm run build:web

# Deploy static files from web-build/
# Compatible with Netlify, Vercel, GitHub Pages, etc.
```

### Mobile Deployment
```bash
# Build for iOS
npm run build:ios

# Build for Android  
npm run build:android

# Deploy to app stores using Expo Application Services (EAS)
```

## Performance

### WASM Module
- **Size**: ~3.8MB (includes full Go runtime)
- **Load Time**: ~200ms on broadband
- **Processing**: <10ms for typical infrastructure definitions
- **Memory**: ~5MB runtime footprint

### React Native
- **Bundle Size**: ~500KB (excluding WASM)
- **Render Performance**: 60fps on modern devices
- **Platform Support**: Web, iOS 11+, Android API 21+

## Browser Support

| Browser | Web App | Diagram Rendering |
|---------|---------|-------------------|
| Chrome 57+ | ✅ | ✅ |
| Firefox 52+ | ✅ | ✅ |
| Safari 11+ | ✅ | ✅ |
| Edge 16+ | ✅ | ✅ |
| Mobile Safari | ✅ | ❌* |
| Chrome Mobile | ✅ | ❌* |

*Mobile browsers can view DOT output but don't render diagrams due to WASM limitations.

## Troubleshooting

### WASM Module Won't Load
- Ensure `gorph.wasm` and `wasm_exec.js` are in `/public`
- Check browser console for WASM errors
- Verify server serves `.wasm` files with correct MIME type

### Expo Development Issues
- Clear Expo cache: `expo r -c`
- Restart Metro bundler
- Check Node.js version compatibility

### Build Failures
- Ensure Go 1.23+ is installed
- Run `go mod tidy` in backend directory
- Check GOROOT environment variable

## Contributing

1. Make changes to Go backend in `web/backend/main.go`
2. Rebuild WASM: `npm run build:wasm`
3. Test in development: `npm run web`
4. Update components in `src/components/`
5. Test responsive design on multiple screen sizes

## License

Same as parent Gorph project. 