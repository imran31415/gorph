# Gorph Template Library

This directory contains YAML infrastructure templates that can be used with the Gorph infrastructure visualization tool.

## Available Templates

### 1. **simple.yml** - Simple Web App
A basic web application with client, server, and database components.

**Components:**
- Client (User Facing)
- WebServer (Frontend)
- Database (Database)
- BackupService (Backend)

**Use Case:** Perfect for learning the Gorph syntax or modeling simple applications.

### 2. **webapp.yml** - Web Application
A full-stack web application with comprehensive infrastructure.

**Components:**
- User (User Facing)
- CDN (Network)
- LoadBalancer (Network)
- WebServer (Frontend)
- APIServer (Backend)
- Database (Database)
- Cache (Database)
- Analytics (Integration)

**Use Case:** Modern web applications with caching, CDN, and analytics.

### 3. **microservices.yml** - Microservices Architecture
A microservices-based architecture with API gateway and multiple services.

**Components:**
- MobileApp (User Facing)
- APIGateway (Network)
- UserService, OrderService, PaymentService, NotificationService (Backend)
- UserDB, OrderDB (Database)
- MessageQueue (Infrastructure)
- PaymentGateway, EmailProvider (Integration)

**Use Case:** Complex applications with multiple microservices and external integrations.

### 4. **data-pipeline.yml** - Data Pipeline
A comprehensive data processing pipeline with ETL, streaming, and ML components.

**Components:**
- DataSource (Integration)
- IngestionService, DataProcessor, StreamProcessor, MLModel (Backend)
- RawDataLake, DataWarehouse, FeatureStore (Database)
- EventQueue (Infrastructure)
- Dashboard (Frontend)
- Scheduler (Infrastructure)

**Use Case:** Data engineering and machine learning pipelines.

### 5. **deploy.yml** - Deployment Pipeline
A CI/CD deployment pipeline with GitOps and Kubernetes.

**Components:**
- GitHub (SCM)
- CI_Server (CI)
- DockerRegistry (Registry)
- HelmChart (Config)
- ArgoCD (CD)
- ProductionCluster (Environment)

**Use Case:** Modern DevOps and GitOps workflows.

### 6. **infra.yml** - Infrastructure
A comprehensive infrastructure setup with multiple environments and services.

**Components:**
- Customer, MobileUser (User Facing)
- WebApp, MobileApp (Frontend)
- LoadBalancer, API_Gateway (Network)
- APIServer, AuthService, PaymentProcessor, NotificationService (Backend)
- MySQL, Redis, Elasticsearch (Database)
- Stripe, SendGrid (Integration)
- LoggingService, MonitoringService (Internal)
- Kubernetes, AWS (Infrastructure)

**Use Case:** Enterprise-grade infrastructure with monitoring and external services.

### 7. **gorph-app.yml** - Gorph Application (Meta)
The architecture of the Gorph infrastructure visualization tool itself.

**Components:**
- User, WebBrowser, MobileDevice (User Facing)
- ReactNativeApp, WebView, DiagramRenderer (Frontend)
- GoWasmModule, WasmBridge (Backend)
- QuickChartAPI (Integration)
- MetroBundler, ExpoDevServer (Infrastructure)
- TemplateLibrary (Config)
- ValidationSystem (Internal)

**Use Case:** Understanding the architecture of the Gorph tool itself.

## Template Format

Each template follows the Gorph YAML format:

```yaml
entities:
  - id: ComponentName
    category: CATEGORY
    description: "Component description"
    status: healthy|degraded|down
    owner: team-name
    environment: production|staging|development
    tags: [tag1, tag2]
    attributes:
      key: value
    deployment_config:
      replicas: 3
      image: image:tag

connections:
  - from: SourceComponent
    to: TargetComponent
    type: ConnectionType
```

## Categories

- **USER_FACING**: External users and interfaces
- **FRONTEND**: User interface components
- **BACKEND**: Server-side services
- **DATABASE**: Data storage systems
- **NETWORK**: Network infrastructure
- **INTEGRATION**: External services and APIs
- **INFRASTRUCTURE**: Platform and infrastructure components
- **INTERNAL**: Internal tools and services
- **CI**: Continuous Integration
- **REGISTRY**: Container and artifact registries
- **CONFIG**: Configuration management
- **CD**: Continuous Deployment
- **ENVIRONMENT**: Environment management
- **SCM**: Source Control Management

## Connection Types

- **HTTP_Request**: Standard HTTP requests
- **API_Call**: API calls between services
- **DB_Connection**: Database connections
- **Service_Call**: Internal service calls
- **User_Interaction**: User interactions
- **Internal_API**: Internal API calls
- **Triggers_Build**: CI/CD triggers
- **Pushes_Image**: Container image pushes
- **Updates_Config**: Configuration updates
- **Watches_Config**: Configuration watching
- **Deploys_To**: Deployment actions
- **WASM_Execution**: WebAssembly execution
- **Component_Render**: UI component rendering
- **Code_Bundling**: Code bundling processes
- **Development_Support**: Development tooling
- **File_Reading**: File system operations
- **Validation_Request**: Validation processes
- **SVG_Request**: SVG generation requests

## Adding New Templates

To add a new template:

1. Create a new `.yml` file in this directory
2. Follow the established format and naming conventions
3. Include comprehensive descriptions and attributes
4. Test the template in the Gorph application
5. Update this README with the new template information

## Usage

Templates are automatically loaded by the Gorph application and can be selected from the Templates modal. Each template provides a starting point for modeling different types of infrastructure architectures. 