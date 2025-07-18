//go:build js && wasm
// +build js,wasm

package main

import (
	"fmt"
	"strings"
	"syscall/js"

	"gopkg.in/yaml.v3"
)

// Helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Infrastructure structs for WASM (simplified versions of our protobuf models)
type Entity struct {
	ID               string                 `json:"id" yaml:"id"`
	Category         string                 `json:"category" yaml:"category"`
	Description      string                 `json:"description" yaml:"description"`
	Status           string                 `json:"status" yaml:"status"`
	Owner            string                 `json:"owner" yaml:"owner"`
	Environment      string                 `json:"environment" yaml:"environment"`
	Tags             []string               `json:"tags" yaml:"tags"`
	Attributes       map[string]string      `json:"attributes" yaml:"attributes"`
	DeploymentConfig map[string]interface{} `json:"deployment_config" yaml:"deployment_config"`
	Shape            string                 `json:"shape" yaml:"shape"`
	Icon             string                 `json:"icon" yaml:"icon"`
}

type Connection struct {
	From string `json:"from" yaml:"from"`
	To   string `json:"to" yaml:"to"`
	Type string `json:"type" yaml:"type"`
}

type Infrastructure struct {
	Entities    []Entity     `json:"entities" yaml:"entities"`
	Connections []Connection `json:"connections" yaml:"connections"`
}

// Style configuration (embedded version)
type StyleConfig struct {
	Graph struct {
		Direction  string `yaml:"direction"`
		FontFamily string `yaml:"font_family"`
		NodeShape  string `yaml:"node_shape"`
	} `yaml:"graph"`
	StatusColors     map[string]string            `yaml:"status_colors"`
	ConnectionStyles map[string]map[string]string `yaml:"connection_styles"`
	Categories       map[string]map[string]string `yaml:"categories"`
	Node             struct {
		MaxDescriptionLength int    `yaml:"max_description_length"`
		TruncationSuffix     string `yaml:"truncation_suffix"`
		BorderWidth          int    `yaml:"border_width"`
		CellBorder           int    `yaml:"cell_border"`
		CellSpacing          int    `yaml:"cell_spacing"`
		StatusBarHeight      int    `yaml:"status_bar_height"`
	} `yaml:"node"`
}

// Default style configuration
var defaultStyle = StyleConfig{
	Graph: struct {
		Direction  string `yaml:"direction"`
		FontFamily string `yaml:"font_family"`
		NodeShape  string `yaml:"node_shape"`
	}{
		Direction:  "LR",
		FontFamily: "Helvetica",
		NodeShape:  "plaintext",
	},
	StatusColors: map[string]string{
		"healthy":  "green",
		"degraded": "yellow",
		"down":     "red",
		"unknown":  "lightgray",
	},
	ConnectionStyles: map[string]map[string]string{
		"API_Call": {
			"style": "dashed",
			"color": "orange",
		},
		"Internal_API": {
			"style": "dotted",
			"color": "gray",
		},
		"DB_Connection": {
			"color": "blue",
		},
		"Service_Call": {
			"color": "black",
		},
		"HTTP_Request": {
			"color": "black",
		},
		"User_Interaction": {
			"color": "purple",
			"style": "bold",
		},
	},
	Categories: map[string]map[string]string{
		"USER_FACING":    {"display_name": "User Facing"},
		"FRONTEND":       {"display_name": "Frontend"},
		"BACKEND":        {"display_name": "Backend"},
		"DATABASE":       {"display_name": "Database"},
		"NETWORK":        {"display_name": "Network"},
		"INTEGRATION":    {"display_name": "Integration"},
		"INFRASTRUCTURE": {"display_name": "Infrastructure"},
		"INTERNAL":       {"display_name": "Internal"},
		"CI":             {"display_name": "CI/CD"},
		"REGISTRY":       {"display_name": "Registry"},
		"CONFIG":         {"display_name": "Configuration"},
		"CD":             {"display_name": "Deployment"},
		"ENVIRONMENT":    {"display_name": "Environment"},
		"SCM":            {"display_name": "Source Control"},
	},
	Node: struct {
		MaxDescriptionLength int    `yaml:"max_description_length"`
		TruncationSuffix     string `yaml:"truncation_suffix"`
		BorderWidth          int    `yaml:"border_width"`
		CellBorder           int    `yaml:"cell_border"`
		CellSpacing          int    `yaml:"cell_spacing"`
		StatusBarHeight      int    `yaml:"status_bar_height"`
	}{
		MaxDescriptionLength: 24,
		TruncationSuffix:     "...",
		BorderWidth:          1,
		CellBorder:           0,
		CellSpacing:          0,
		StatusBarHeight:      8,
	},
}

// JavaScript-exposed functions
func yamlToDot(this js.Value, args []js.Value) interface{} {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("yamlToDot panic: %v\n", r)
		}
	}()

	fmt.Println("yamlToDot called")

	if len(args) != 1 {
		return map[string]interface{}{
			"error": "yamlToDot requires exactly 1 argument (YAML string)",
		}
	}

	yamlStr := args[0].String()
	fmt.Printf("Processing YAML: %s\n", yamlStr[:min(100, len(yamlStr))])

	// Parse YAML
	var infra Infrastructure
	if err := yaml.Unmarshal([]byte(yamlStr), &infra); err != nil {
		return map[string]interface{}{
			"error": fmt.Sprintf("Failed to parse YAML: %v", err),
		}
	}

	// Generate DOT
	dotOutput := generateDOT(&infra, &defaultStyle)
	fmt.Println("DOT generated successfully")

	return map[string]interface{}{
		"dot":    dotOutput,
		"error":  nil,
		"status": "success",
	}
}

func validateYaml(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"valid":  false,
			"errors": []string{"validateYaml requires exactly 1 argument (YAML string)"},
		}
	}

	yamlStr := args[0].String()

	var infra Infrastructure
	if err := yaml.Unmarshal([]byte(yamlStr), &infra); err != nil {
		return map[string]interface{}{
			"valid":  false,
			"errors": []string{fmt.Sprintf("Invalid YAML: %v", err)},
		}
	}

	// Validate infrastructure
	errors := validateInfrastructure(&infra)

	return map[string]interface{}{
		"valid":  len(errors) == 0,
		"errors": errors,
	}
}

func getTemplates(this js.Value, args []js.Value) interface{} {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("getTemplates panic: %v\n", r)
		}
	}()

	fmt.Println("getTemplates called")

	// Return embedded templates (simplified versions)
	templates := map[string]string{
		"simple": `entities:
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
    type: DB_Connection`,

		"webapp": `entities:
  - id: User
    category: USER_FACING
    description: "End user accessing the web app"
    status: healthy
    owner: product
    environment: production
    tags: [external]

  - id: WebServer
    category: FRONTEND
    description: "Static web server"
    status: healthy
    owner: frontend-team
    environment: production
    tags: [critical]
    attributes:
      framework: Nginx

  - id: APIServer
    category: BACKEND
    description: "REST API backend"
    status: healthy
    owner: backend-team
    environment: production
    tags: [critical]
    attributes:
      language: Python

  - id: Database
    category: DATABASE
    description: "PostgreSQL database"
    status: healthy
    owner: data-team
    environment: production
    attributes:
      engine: PostgreSQL

connections:
  - from: User
    to: WebServer
    type: HTTP_Request
  - from: WebServer
    to: APIServer
    type: API_Call
  - from: APIServer
    to: Database
    type: DB_Connection`,

		"microservices": `entities:
  - id: APIGateway
    category: NETWORK
    description: "Entry point for all services"
    status: healthy
    owner: platform-team
    environment: production

  - id: UserService
    category: BACKEND
    description: "User management microservice"
    status: healthy
    owner: user-team
    environment: production
    attributes:
      language: Java

  - id: OrderService
    category: BACKEND
    description: "Order processing service"
    status: degraded
    owner: order-team
    environment: production
    attributes:
      language: Go

  - id: PaymentService
    category: BACKEND
    description: "Payment processing service"
    status: down
    owner: payment-team
    environment: production
    tags: [critical]
    attributes:
      language: Python

  - id: UserDB
    category: DATABASE
    description: "User data PostgreSQL"
    status: healthy
    owner: user-team
    environment: production

  - id: OrderDB
    category: DATABASE
    description: "Order data MongoDB"
    status: healthy
    owner: order-team
    environment: production

connections:
  - from: APIGateway
    to: UserService
    type: Service_Call
  - from: APIGateway
    to: OrderService
    type: Service_Call
  - from: APIGateway
    to: PaymentService
    type: Service_Call
  - from: UserService
    to: UserDB
    type: DB_Connection
  - from: OrderService
    to: OrderDB
    type: DB_Connection`,
	}

	fmt.Printf("getTemplates returning %d templates\n", len(templates))
	for key := range templates {
		fmt.Printf("  - %s\n", key)
	}

	// Convert Go map to JavaScript object manually
	jsObject := js.ValueOf(map[string]interface{}{})
	for key, value := range templates {
		jsObject.Set(key, js.ValueOf(value))
	}

	fmt.Println("Successfully converted to JavaScript object")
	return jsObject
}

// Generate DOT output from infrastructure
func generateDOT(infra *Infrastructure, style *StyleConfig) string {
	var sb strings.Builder

	// Graph header
	sb.WriteString("digraph Infrastructure {\n")
	sb.WriteString(fmt.Sprintf("  rankdir=%s;\n", style.Graph.Direction))
	sb.WriteString(fmt.Sprintf("  node [shape=%s, fontname=%s];\n",
		style.Graph.NodeShape, style.Graph.FontFamily))

	// Group entities by category
	categories := make(map[string][]Entity)
	for _, e := range infra.Entities {
		categories[e.Category] = append(categories[e.Category], e)
	}

	// Generate clusters
	for category, entities := range categories {
		displayName := getCategoryDisplayName(category, style)

		sb.WriteString(fmt.Sprintf("  subgraph cluster_%s {\n", category))
		sb.WriteString(fmt.Sprintf("    label=\"%s\";\n", displayName))

		for _, entity := range entities {
			generateEntityNode(&sb, entity, style)
		}

		sb.WriteString("  }\n")
	}

	// Generate connections
	for _, conn := range infra.Connections {
		generateConnection(&sb, conn, style)
	}

	sb.WriteString("}\n")
	return sb.String()
}

func getCategoryDisplayName(category string, style *StyleConfig) string {
	if config, exists := style.Categories[category]; exists {
		if displayName, exists := config["display_name"]; exists {
			return displayName
		}
	}
	return strings.Title(strings.ToLower(category))
}

func generateEntityNode(sb *strings.Builder, entity Entity, style *StyleConfig) {
	description := entity.Description
	if len(description) > style.Node.MaxDescriptionLength {
		description = description[:style.Node.MaxDescriptionLength] + style.Node.TruncationSuffix
	}

	statusColor := getStatusColor(entity.Status, style)

	sb.WriteString(fmt.Sprintf(`    %s [label=<
      <TABLE BORDER="%d" CELLBORDER="%d" CELLSPACING="%d">
        <TR><TD><B>%s</B></TD></TR>
        <TR><TD>%s</TD></TR>
        <TR><TD BGCOLOR="%s" HEIGHT="%d"></TD></TR>
      </TABLE>
    >];
`, entity.ID,
		style.Node.BorderWidth,
		style.Node.CellBorder,
		style.Node.CellSpacing,
		entity.ID,
		description,
		statusColor,
		style.Node.StatusBarHeight))
}

func getStatusColor(status string, style *StyleConfig) string {
	if color, exists := style.StatusColors[strings.ToLower(status)]; exists {
		return color
	}
	return style.StatusColors["unknown"]
}

func generateConnection(sb *strings.Builder, conn Connection, style *StyleConfig) {
	edgeAttrs := getConnectionAttributes(conn.Type, style)

	sb.WriteString(fmt.Sprintf("  %s -> %s [label=\"%s\"%s];\n",
		conn.From, conn.To, conn.Type, edgeAttrs))
}

func getConnectionAttributes(connType string, style *StyleConfig) string {
	styleConfig, exists := style.ConnectionStyles[connType]
	if !exists {
		return ""
	}

	var attrs []string

	if color, exists := styleConfig["color"]; exists {
		attrs = append(attrs, fmt.Sprintf("color=%s", color))
	}

	if styleAttr, exists := styleConfig["style"]; exists {
		attrs = append(attrs, fmt.Sprintf("style=%s", styleAttr))
	}

	if len(attrs) == 0 {
		return ""
	}

	return ", " + strings.Join(attrs, ", ")
}

// Validation function
func validateInfrastructure(infra *Infrastructure) []string {
	var errors []string

	if len(infra.Entities) == 0 {
		errors = append(errors, "Infrastructure must have at least one entity")
	}

	// Check for duplicate entity IDs
	entityIds := make(map[string]bool)
	for i, entity := range infra.Entities {
		if entity.ID == "" {
			errors = append(errors, fmt.Sprintf("Entity %d: ID is required", i))
			continue
		}

		if entityIds[entity.ID] {
			errors = append(errors, fmt.Sprintf("Duplicate entity ID: %s", entity.ID))
		}
		entityIds[entity.ID] = true

		if entity.Category == "" {
			errors = append(errors, fmt.Sprintf("Entity %s: Category is required", entity.ID))
		}

		if entity.Description == "" {
			errors = append(errors, fmt.Sprintf("Entity %s: Description is required", entity.ID))
		}

		if entity.Status == "" {
			errors = append(errors, fmt.Sprintf("Entity %s: Status is required", entity.ID))
		}
	}

	// Validate connections
	for i, conn := range infra.Connections {
		if conn.From == "" {
			errors = append(errors, fmt.Sprintf("Connection %d: From is required", i))
		} else if !entityIds[conn.From] {
			errors = append(errors, fmt.Sprintf("Connection %d: From entity '%s' does not exist", i, conn.From))
		}

		if conn.To == "" {
			errors = append(errors, fmt.Sprintf("Connection %d: To is required", i))
		} else if !entityIds[conn.To] {
			errors = append(errors, fmt.Sprintf("Connection %d: To entity '%s' does not exist", i, conn.To))
		}

		if conn.Type == "" {
			errors = append(errors, fmt.Sprintf("Connection %d: Type is required", i))
		}
	}

	return errors
}

// Main function - sets up WASM exports
func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("WASM panic recovered: %v\n", r)
		}
	}()

	fmt.Println("Gorph WASM module starting...")

	// Register functions to be callable from JavaScript
	js.Global().Set("yamlToDot", js.FuncOf(yamlToDot))
	js.Global().Set("validateYaml", js.FuncOf(validateYaml))
	js.Global().Set("getTemplates", js.FuncOf(getTemplates))

	fmt.Println("Gorph WASM module loaded successfully!")
	fmt.Println("Functions registered. Keeping program alive...")

	// Keep the program running indefinitely
	select {}
}
