# Gorph Protobuf API Specification

## Overview

This document defines the protobuf API specification for Gorph, providing a strongly-typed, versioned interface for infrastructure diagram creation and management.

## Design Principles

### 1. **YAML Compatibility**
The protobuf API maintains 100% compatibility with existing YAML definitions. Every field and enum value maps directly to YAML equivalents, ensuring seamless migration.

### 2. **Extensibility**
- Uses `google.protobuf.Struct` for flexible deployment configurations
- Map fields for attributes allow arbitrary key-value metadata
- Enum values include `UNSPECIFIED` for future extensions

### 3. **Validation-First**
- Required fields are clearly defined
- Enum constraints prevent invalid states
- Built-in validation RPCs provide immediate feedback

### 4. **Service-Oriented**
- Complete CRUD operations for all data types
- Atomic operations with proper error handling
- Pagination support for large datasets

## Data Model Mapping

### YAML → Protobuf Entity Mapping

| YAML Field | Protobuf Field | Type | Notes |
|------------|---------------|------|-------|
| `id` | `id` | `string` | Required, unique within infrastructure |
| `category` | `category` | `Category` | Enum with all YAML categories |
| `description` | `description` | `string` | Required |
| `status` | `status` | `Status` | Enum: HEALTHY, DEGRADED, DOWN |
| `owner` | `owner` | `string` | Required |
| `environment` | `environment` | `string` | Optional (default: production) |
| `tags` | `tags` | `repeated string` | Optional array |
| `attributes` | `attributes` | `map<string,string>` | Key-value pairs |
| `deployment_config` | `deployment_config` | `google.protobuf.Struct` | Flexible structure |
| `shape` | `shape` | `string` | Visual hint |
| `icon` | `icon` | `string` | Icon identifier |

### Connection Types

All connection types from YAML are preserved as enum values:

```protobuf
enum ConnectionType {
  CONNECTION_TYPE_HTTP_REQUEST = 1;      // HTTP_Request
  CONNECTION_TYPE_API_CALL = 2;          // API_Call  
  CONNECTION_TYPE_DB_CONNECTION = 3;     // DB_Connection
  CONNECTION_TYPE_SERVICE_CALL = 4;      // Service_Call
  CONNECTION_TYPE_USER_INTERACTION = 5;  // User_Interaction
  // ... all other types
}
```

## Service Architecture

### Entity Service
```protobuf
service EntityService {
  rpc CreateEntity(CreateEntityRequest) returns (CreateEntityResponse);
  rpc GetEntity(GetEntityRequest) returns (GetEntityResponse);
  rpc UpdateEntity(UpdateEntityRequest) returns (UpdateEntityResponse);
  rpc DeleteEntity(DeleteEntityRequest) returns (DeleteEntityResponse);
  rpc ListEntities(ListEntitiesRequest) returns (ListEntitiesResponse);
}
```

**Key Features:**
- Field masks for partial updates
- Rich filtering (category, status, owner, tags)
- Pagination with page tokens
- Optimistic locking with versions

### Diagram Service
```protobuf
service DiagramService {
  rpc GenerateDiagram(GenerateDiagramRequest) returns (GenerateDiagramResponse);
}
```

**Supported Formats:**
- `OUTPUT_FORMAT_DOT` - Graphviz DOT format
- `OUTPUT_FORMAT_PNG` - PNG images
- `OUTPUT_FORMAT_SVG` - Scalable vector graphics
- `OUTPUT_FORMAT_PDF` - PDF documents

### Import/Export Service
```protobuf
service ImportExportService {
  rpc ImportYAML(ImportYAMLRequest) returns (ImportYAMLResponse);
  rpc ExportYAML(ExportYAMLRequest) returns (ExportYAMLResponse);
}
```

**Bidirectional Compatibility:**
- Import existing YAML files → Infrastructure protobuf
- Export Infrastructure protobuf → YAML compatible with CLI

## Validation Framework

### Built-in Validation Rules

1. **Infrastructure Level:**
   - ID must be non-empty
   - Name must be non-empty
   - Version must be positive

2. **Entity Level:**
   - ID must be unique within infrastructure
   - Category must not be `CATEGORY_UNSPECIFIED`
   - Status must not be `STATUS_UNSPECIFIED`
   - Owner and description are required

3. **Connection Level:**
   - From/To must reference existing entities
   - Type must not be `CONNECTION_TYPE_UNSPECIFIED`

### Validation Response Format
```protobuf
message ValidationError {
  string field = 1;        // "entities[0].category"
  string message = 2;      // "Category must be specified"
  string entity_id = 3;    // Optional entity context
}
```

## Usage Patterns

### 1. **Web Application Integration**
```go
// Create infrastructure via gRPC
client := gorph.NewGorphServiceClient(conn)

infra := &gorph.Infrastructure{
    Name: "My Web App",
    Entities: []*gorph.Entity{...},
    Connections: []*gorph.Connection{...},
}

response, err := client.CreateInfrastructure(ctx, &gorph.CreateInfrastructureRequest{
    Infrastructure: infra,
})
```

### 2. **CLI Tool Integration**
```go
// Import existing YAML
yamlContent := loadYAMLFile("infra.yml")
importResp, err := client.ImportYAML(ctx, &gorph.ImportYAMLRequest{
    YamlContent: yamlContent,
})

// Generate diagram
diagResp, err := client.GenerateDiagram(ctx, &gorph.GenerateDiagramRequest{
    InfrastructureId: importResp.Infrastructure.Id,
    Format: gorph.OutputFormat_OUTPUT_FORMAT_PNG,
})

saveFile("diagram.png", diagResp.Content)
```

### 3. **CI/CD Pipeline Integration**
```go
// Validate infrastructure in CI
validateResp, err := client.ValidateInfrastructure(ctx, &gorph.ValidateInfrastructureRequest{
    Infrastructure: infra,
})

if !validateResp.Valid {
    for _, err := range validateResp.Errors {
        log.Printf("Validation error in %s: %s", err.Field, err.Message)
    }
    os.Exit(1)
}
```

## Future Extensions

### Planned Features
1. **Real-time Updates** - Streaming RPCs for live infrastructure monitoring
2. **Diff Operations** - Compare infrastructure versions
3. **Templates** - Reusable infrastructure patterns
4. **Multi-environment** - Environment-specific overrides
5. **Access Control** - Role-based permissions

### Backwards Compatibility Promise
- Existing fields will never be removed
- Enum values will never be changed
- New fields will be optional
- YAML compatibility will be maintained

## Implementation Notes

### Code Generation
```bash
# Generate Go bindings
protoc --go_out=. --go-grpc_out=. api/gorph.proto

# Generate other language bindings
protoc --python_out=. api/gorph.proto
protoc --js_out=. api/gorph.proto
```

### Deployment Config Handling
The `deployment_config` field uses `google.protobuf.Struct` to support arbitrary configuration:

```go
// YAML: replicas: 3, image: "app:v1.0"
config := map[string]interface{}{
    "replicas": 3,
    "image": "app:v1.0",
    "env": []map[string]interface{}{
        {"name": "PORT", "value": "8080"},
    },
}

deployStruct, _ := structpb.NewStruct(config)
entity.DeploymentConfig = deployStruct
```

## Migration Path

### For Existing YAML Users
1. Continue using YAML files with CLI tool
2. Use Import/Export RPCs for programmatic access
3. Gradually migrate to native protobuf for new features

### For New Integrations
1. Use protobuf API directly for type safety
2. Leverage validation RPCs for error prevention
3. Use diagram generation RPCs for custom outputs

This specification provides a complete foundation for building modern infrastructure tooling while maintaining compatibility with existing YAML-based workflows. 