# Gorph YAML Schema Documentation

## Overview

Gorph uses a structured YAML format to define infrastructure diagrams. The schema consists of two main sections: `entities` (nodes) and `connections` (relationships between nodes).

## Basic Structure

```yaml
entities:
  - id: "unique_entity_id"
    category: "CATEGORY_TYPE"
    description: "Human readable description"
    status: "health_status"
    owner: "team_name"
    environment: "environment_type"
    attributes:  # Optional
      key: "value"
    tags: ["tag1", "tag2"]  # Optional

connections:
  - from: "source_entity_id"
    to: "target_entity_id"
    type: "connection_type"
```

## Entity Properties

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier for the entity | `"WebServer"`, `"Database"` |
| `category` | string | Entity classification | `"FRONTEND"`, `"BACKEND"` |
| `description` | string | Human-readable description | `"Main web server"` |
| `status` | string | Health/operational status | `"healthy"`, `"degraded"` |
| `owner` | string | Team or person responsible | `"frontend-team"`, `"ops"` |
| `environment` | string | Deployment environment | `"production"`, `"staging"` |

### Optional Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `attributes` | object | Key-value pairs for additional metadata | `{"language": "Go", "version": "1.0"}` |
| `tags` | array | Array of tags for categorization | `["critical", "external", "api"]` |

## Available Categories

| Category | Display Name | Description | Use Case |
|----------|--------------|-------------|----------|
| `USER_FACING` | User Facing | Direct user interaction points | Web browsers, mobile apps, APIs |
| `FRONTEND` | Frontend | Client-side applications | React apps, static sites |
| `BACKEND` | Backend | Server-side applications | APIs, microservices |
| `DATABASE` | Database | Data storage systems | PostgreSQL, Redis, MongoDB |
| `NETWORK` | Network | Network infrastructure | Load balancers, CDNs |
| `INTEGRATION` | Integration | External services | Third-party APIs, webhooks |
| `INFRASTRUCTURE` | Infrastructure | Platform services | Kubernetes, Docker |
| `INTERNAL` | Internal | Internal tools/services | Monitoring, logging |
| `CI` | CI/CD | Continuous integration | Jenkins, GitHub Actions |
| `REGISTRY` | Registry | Container/image registries | Docker Hub, ECR |
| `CONFIG` | Configuration | Configuration management | ConfigMaps, secrets |
| `CD` | Deployment | Continuous deployment | ArgoCD, Flux |
| `ENVIRONMENT` | Environment | Environment management | Namespaces, clusters |
| `SCM` | Source Control | Version control systems | Git, GitHub |

## Available Status Values

| Status | Color | Description |
|--------|-------|-------------|
| `healthy` | Green | Operating normally |
| `degraded` | Yellow | Reduced functionality |
| `down` | Red | Not operational |
| `unknown` | Gray | Status unclear |

## Available Environments

| Environment | Description |
|-------------|-------------|
| `production` | Live production environment |
| `staging` | Pre-production testing |
| `development` | Development environment |

## Connection Types

| Type | Description | Visual Style |
|------|-------------|--------------|
| `HTTP_Request` | HTTP/HTTPS requests | Solid black line |
| `API_Call` | API calls | Dashed orange line |
| `Internal_API` | Internal service calls | Dotted gray line |
| `DB_Connection` | Database connections | Solid blue line |
| `Service_Call` | Service-to-service calls | Solid black line |
| `User_Interaction` | User interactions | Bold purple line |
| `Triggers_Build` | CI/CD triggers | Solid dark green line |
| `Pushes_Image` | Container image pushes | Solid blue line |
| `Updates_Config` | Configuration updates | Solid orange line |
| `Watches_Config` | Configuration monitoring | Solid red line |
| `Deploys_To` | Deployment relationships | Solid purple line |
| `Deploys` | Deployment actions | Solid purple line |
| `Hosts` | Hosting relationships | Solid brown line |

## Examples

### Simple Web Application

```yaml
entities:
  - id: Client
    category: USER_FACING
    description: "Web browser client"
    status: healthy
    owner: frontend
    environment: production

  - id: WebServer
    category: FRONTEND
    description: "Simple web server"
    status: healthy
    owner: ops
    environment: production
    attributes:
      language: Go

  - id: Database
    category: DATABASE
    description: "SQLite database"
    status: degraded
    owner: ops
    environment: production
    attributes:
      engine: SQLite

connections:
  - from: Client
    to: WebServer
    type: HTTP_Request
  - from: WebServer
    to: Database
    type: DB_Connection
```

### Microservices Architecture

```yaml
entities:
  - id: User
    category: USER_FACING
    description: "End user"
    status: healthy
    owner: product
    environment: production

  - id: API_Gateway
    category: NETWORK
    description: "API Gateway"
    status: healthy
    owner: platform
    environment: production

  - id: AuthService
    category: BACKEND
    description: "Authentication service"
    status: healthy
    owner: backend-team
    environment: production
    tags: ["critical"]

  - id: UserService
    category: BACKEND
    description: "User management service"
    status: healthy
    owner: backend-team
    environment: production

  - id: Database
    category: DATABASE
    description: "PostgreSQL database"
    status: healthy
    owner: ops
    environment: production

connections:
  - from: User
    to: API_Gateway
    type: HTTP_Request
  - from: API_Gateway
    to: AuthService
    type: Service_Call
  - from: API_Gateway
    to: UserService
    type: Service_Call
  - from: AuthService
    to: Database
    type: DB_Connection
  - from: UserService
    to: Database
    type: DB_Connection
```

### CI/CD Pipeline

```yaml
entities:
  - id: GitRepo
    category: SCM
    description: "Source code repository"
    status: healthy
    owner: dev-team
    environment: production

  - id: CI_Server
    category: CI
    description: "Jenkins CI server"
    status: healthy
    owner: devops
    environment: production

  - id: ContainerRegistry
    category: REGISTRY
    description: "Docker registry"
    status: healthy
    owner: devops
    environment: production

  - id: Kubernetes
    category: INFRASTRUCTURE
    description: "Kubernetes cluster"
    status: healthy
    owner: devops
    environment: production

connections:
  - from: GitRepo
    to: CI_Server
    type: Triggers_Build
  - from: CI_Server
    to: ContainerRegistry
    type: Pushes_Image
  - from: CI_Server
    to: Kubernetes
    type: Deploys_To
```

## Best Practices

### 1. Entity Naming
- Use descriptive, unique IDs
- Follow consistent naming conventions
- Avoid special characters in IDs

### 2. Descriptions
- Write clear, concise descriptions
- Include key technologies or versions
- Explain the entity's purpose

### 3. Categories
- Choose the most specific category
- Use `USER_FACING` for external interfaces
- Use `INTERNAL` for internal tools

### 4. Status Management
- Keep status values current
- Use `unknown` when status is unclear
- Consider automated status updates

### 5. Attributes
- Use attributes for technical details
- Include version information
- Add relevant configuration details

### 6. Tags
- Use tags for filtering and grouping
- Common tags: `critical`, `external`, `api`, `legacy`
- Keep tags consistent across entities

### 7. Connections
- Ensure entity IDs match exactly
- Use appropriate connection types
- Avoid circular dependencies

## Validation Rules

1. **Entity IDs must be unique** within the same YAML file
2. **Connection references** must point to existing entities
3. **Required fields** must be present for all entities
4. **Category values** must be from the predefined list
5. **Status values** must be from the predefined list
6. **Environment values** must be from the predefined list
7. **Connection types** must be from the predefined list

## Using the Builder

The Gorph Builder provides a visual interface for creating YAML configurations:

1. **Add Entities**: Use the "Entities" tab to create new infrastructure components
2. **Add Connections**: Use the "Connections" tab to define relationships
3. **Real-time Sync**: Changes in the Builder automatically update the YAML
4. **Validation**: The Builder provides immediate feedback on errors
5. **Templates**: Start with predefined templates for common patterns

## Tips for Complex Diagrams

1. **Start Simple**: Begin with core components, add details later
2. **Group Related Entities**: Use consistent categories and tags
3. **Document Dependencies**: Use appropriate connection types
4. **Keep It Current**: Update status and descriptions regularly
5. **Use Attributes**: Add technical details for clarity
6. **Leverage Tags**: Use tags for filtering and organization

## Troubleshooting

### Common Issues

1. **Duplicate Entity IDs**: Ensure each entity has a unique ID
2. **Missing References**: Check that connection `from`/`to` IDs exist
3. **Invalid Categories**: Use only predefined category values
4. **YAML Syntax**: Ensure proper YAML indentation and formatting

### Validation Errors

- **"Entity ID must be unique"**: Rename duplicate entities
- **"Entity does not exist"**: Check spelling of entity IDs in connections
- **"Invalid category"**: Use one of the predefined categories
- **"Invalid status"**: Use one of the predefined status values

## Advanced Features

### Custom Attributes
Add any key-value pairs to entities for additional metadata:

```yaml
attributes:
  language: "Go"
  version: "1.19"
  framework: "Gin"
  port: "8080"
  replicas: "3"
```

### Tags for Filtering
Use tags to categorize and filter entities:

```yaml
tags: ["critical", "external", "api", "monitoring"]
```

### Complex Relationships
Model sophisticated infrastructure patterns:

```yaml
connections:
  - from: LoadBalancer
    to: WebServer1
    type: HTTP_Request
  - from: LoadBalancer
    to: WebServer2
    type: HTTP_Request
  - from: WebServer1
    to: Database
    type: DB_Connection
  - from: WebServer2
    to: Database
    type: DB_Connection
```

This schema provides a flexible foundation for modeling any infrastructure architecture while maintaining consistency and clarity. 