# Gorph Protobuf API Specification

This directory contains the protobuf API specification for Gorph, providing a strongly-typed interface for creating and managing infrastructure diagrams.

## Overview

The Gorph protobuf API defines:
- **Data Models**: Entity, Connection, Infrastructure
- **Service RPCs**: CRUD operations and diagram generation
- **Validation**: Built-in validation rules and error reporting
- **Import/Export**: YAML compatibility for existing workflows

## Quick Start

### 1. Generate Go Code

```bash
# Install protobuf dependencies
make deps

# Generate Go code from protobuf
make proto
```

### 2. Basic Usage

```go
package main

import (
    gorph "gorph/v2/api/v1"
    "google.golang.org/protobuf/types/known/structpb"
)

func main() {
    // Create an entity
    entity := &gorph.Entity{
        Id:          "web-server",
        Category:    gorph.Category_CATEGORY_FRONTEND,
        Description: "Nginx web server",
        Status:      gorph.Status_STATUS_HEALTHY,
        Owner:       "frontend-team",
        Environment: "production",
        Tags:        []string{"critical"},
        Attributes: map[string]string{
            "framework": "Nginx",
            "version":   "1.21",
        },
    }

    // Create a connection
    connection := &gorph.Connection{
        From: "user",
        To:   "web-server",
        Type: gorph.ConnectionType_CONNECTION_TYPE_HTTP_REQUEST,
    }

    // Create infrastructure
    infra := &gorph.Infrastructure{
        Id:          "my-app",
        Name:        "My Application",
        Description: "A simple web application",
        Entities:    []*gorph.Entity{entity},
        Connections: []*gorph.Connection{connection},
    }
}
```

## Data Models

### Entity

Represents an infrastructure component (server, database, service, etc.).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `category` | Category | Component type (FRONTEND, BACKEND, DATABASE, etc.) |
| `description` | string | Human-readable description |
| `status` | Status | Operational status (HEALTHY, DEGRADED, DOWN) |
| `owner` | string | Team or person responsible |
| `environment` | string | Deployment environment (production, staging, etc.) |
| `tags` | string[] | Optional tags for grouping |
| `attributes` | map<string,string> | Key-value metadata |
| `deployment_config` | Struct | Deployment configuration (replicas, image, etc.) |
| `shape` | string | Visual shape hint |
| `icon` | string | Icon identifier |

### Connection

Represents a relationship between entities.

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Source entity ID |
| `to` | string | Target entity ID |
| `type` | ConnectionType | Connection type (HTTP_REQUEST, DB_CONNECTION, etc.) |
| `attributes` | map<string,string> | Optional connection metadata |

### Infrastructure

Represents a complete system architecture.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Human-readable name |
| `description` | string | Infrastructure description |
| `entities` | Entity[] | All components |
| `connections` | Connection[] | All relationships |
| `version` | int64 | Version for optimistic locking |

## Enums

### Category
- `CATEGORY_USER_FACING` - User interfaces, clients
- `CATEGORY_FRONTEND` - Web servers, static sites
- `CATEGORY_BACKEND` - APIs, microservices
- `CATEGORY_DATABASE` - Databases, caches
- `CATEGORY_NETWORK` - Load balancers, gateways
- `CATEGORY_INTEGRATION` - External services
- `CATEGORY_INFRASTRUCTURE` - Orchestration, cloud platforms
- `CATEGORY_INTERNAL` - Monitoring, logging
- `CATEGORY_CI` - Continuous integration
- `CATEGORY_REGISTRY` - Container registries
- `CATEGORY_CONFIG` - Configuration management
- `CATEGORY_CD` - Continuous deployment
- `CATEGORY_ENVIRONMENT` - Runtime environments
- `CATEGORY_SCM` - Source control

### Status
- `STATUS_HEALTHY` - Operating normally
- `STATUS_DEGRADED` - Partial functionality
- `STATUS_DOWN` - Not operational
- `STATUS_UNKNOWN` - Status unclear

### ConnectionType
- `CONNECTION_TYPE_HTTP_REQUEST` - HTTP/HTTPS requests
- `CONNECTION_TYPE_API_CALL` - API calls (REST, GraphQL)
- `CONNECTION_TYPE_DB_CONNECTION` - Database connections
- `CONNECTION_TYPE_SERVICE_CALL` - Service-to-service calls
- `CONNECTION_TYPE_USER_INTERACTION` - User interactions
- `CONNECTION_TYPE_INTERNAL_API` - Internal monitoring/management
- `CONNECTION_TYPE_DEPLOYS` - Deployment relationships
- `CONNECTION_TYPE_HOSTS` - Hosting relationships
- `CONNECTION_TYPE_TRIGGERS_BUILD` - Build triggers
- `CONNECTION_TYPE_PUSHES_IMAGE` - Image registry pushes
- `CONNECTION_TYPE_UPDATES_CONFIG` - Configuration updates
- `CONNECTION_TYPE_WATCHES_CONFIG` - Configuration monitoring
- `CONNECTION_TYPE_DEPLOYS_TO` - Deployment targets

## Service RPCs

### Entity Management
```protobuf
rpc CreateEntity(CreateEntityRequest) returns (CreateEntityResponse);
rpc GetEntity(GetEntityRequest) returns (GetEntityResponse);
rpc UpdateEntity(UpdateEntityRequest) returns (UpdateEntityResponse);
rpc DeleteEntity(DeleteEntityRequest) returns (DeleteEntityResponse);
rpc ListEntities(ListEntitiesRequest) returns (ListEntitiesResponse);
```

### Connection Management
```protobuf
rpc CreateConnection(CreateConnectionRequest) returns (CreateConnectionResponse);
rpc GetConnection(GetConnectionRequest) returns (GetConnectionResponse);
rpc UpdateConnection(UpdateConnectionRequest) returns (UpdateConnectionResponse);
rpc DeleteConnection(DeleteConnectionRequest) returns (DeleteConnectionResponse);
rpc ListConnections(ListConnectionsRequest) returns (ListConnectionsResponse);
```

### Infrastructure Management
```protobuf
rpc CreateInfrastructure(CreateInfrastructureRequest) returns (CreateInfrastructureResponse);
rpc GetInfrastructure(GetInfrastructureRequest) returns (GetInfrastructureResponse);
rpc UpdateInfrastructure(UpdateInfrastructureRequest) returns (UpdateInfrastructureResponse);
rpc DeleteInfrastructure(DeleteInfrastructureRequest) returns (DeleteInfrastructureResponse);
rpc ListInfrastructures(ListInfrastructuresRequest) returns (ListInfrastructuresResponse);
```

### Diagram Operations
```protobuf
rpc GenerateDiagram(GenerateDiagramRequest) returns (GenerateDiagramResponse);
```

### Import/Export
```protobuf
rpc ImportYAML(ImportYAMLRequest) returns (ImportYAMLResponse);
rpc ExportYAML(ExportYAMLRequest) returns (ExportYAMLResponse);
```

### Validation
```protobuf
rpc ValidateInfrastructure(ValidateInfrastructureRequest) returns (ValidateInfrastructureResponse);
```

## Examples

### Creating Infrastructure with Deployment Config

```go
// Complex deployment configuration
deploymentConfig := map[string]interface{}{
    "replicas": 3,
    "image":    "my-app:v1.2.0",
    "env": []map[string]interface{}{
        {"name": "DB_HOST", "value": "postgres.cluster.local"},
        {"name": "DB_PORT", "value": "5432"},
    },
    "resources": map[string]interface{}{
        "requests": map[string]interface{}{
            "cpu":    "100m",
            "memory": "128Mi",
        },
        "limits": map[string]interface{}{
            "cpu":    "500m",
            "memory": "512Mi",
        },
    },
}

// Convert to protobuf Struct
deployStruct, _ := structpb.NewStruct(deploymentConfig)

entity := &gorph.Entity{
    Id:               "api-server",
    Category:         gorph.Category_CATEGORY_BACKEND,
    Description:      "REST API server",
    Status:           gorph.Status_STATUS_HEALTHY,
    Owner:            "backend-team",
    Environment:      "production",
    Tags:             []string{"api", "critical"},
    Attributes:       map[string]string{"language": "Go"},
    DeploymentConfig: deployStruct,
}
```

### Filtering and Pagination

```go
// List entities with filtering
request := &gorph.ListEntitiesRequest{
    InfrastructureId: "my-app",
    Category:         gorph.Category_CATEGORY_BACKEND,
    Status:           gorph.Status_STATUS_HEALTHY,
    Owner:            "backend-team",
    Tags:             []string{"critical"},
    PageSize:         20,
    PageToken:        "", // First page
}
```

### Diagram Generation

```go
// Generate PNG diagram
request := &gorph.GenerateDiagramRequest{
    InfrastructureId: "my-app",
    Format:           gorph.OutputFormat_OUTPUT_FORMAT_PNG,
    StyleConfig:      "", // Use default style
}

response, err := client.GenerateDiagram(ctx, request)
if err != nil {
    log.Fatal(err)
}

// Save to file
ioutil.WriteFile("diagram.png", response.Content, 0644)
```

## Validation Rules

The API includes built-in validation:

- **Entity IDs** must be unique within an infrastructure
- **Categories and Status** must be specified (not UNSPECIFIED)
- **Connections** must reference existing entities
- **Infrastructure ID** is required
- **Owner and Description** are required for entities

Validation errors include field paths and entity context for easy debugging.

## Compatibility with YAML

The protobuf API is fully compatible with existing YAML workflows:

```go
// Import existing YAML
request := &gorph.ImportYAMLRequest{
    YamlContent: yamlString,
}

response, err := client.ImportYAML(ctx, request)
// Returns populated Infrastructure message

// Export to YAML
exportReq := &gorph.ExportYAMLRequest{
    InfrastructureId: response.Infrastructure.Id,
}

yamlResp, err := client.ExportYAML(ctx, exportReq)
// Returns YAML string compatible with CLI tool
```

## Development

```bash
# Generate code
make proto

# Validate protobuf syntax  
make validate-proto

# Build everything
make dev
```

This protobuf specification provides a foundation for building web UIs, CLI tools, CI/CD integrations, and any other tools that need to work with Gorph infrastructure definitions. 