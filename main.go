package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Infrastructure entity and connection definitions
type Entity struct {
	ID               string                 `yaml:"id"`
	Category         string                 `yaml:"category"`
	Description      string                 `yaml:"description"`
	Status           string                 `yaml:"status"`
	Owner            string                 `yaml:"owner"`
	Environment      string                 `yaml:"environment"`
	Tags             []string               `yaml:"tags"`
	Attributes       map[string]string      `yaml:"attributes"`
	DeploymentConfig map[string]interface{} `yaml:"deployment_config"`
	Shape            string                 `yaml:"shape"`
	Icon             string                 `yaml:"icon"`
}

type Connection struct {
	From string `yaml:"from"`
	To   string `yaml:"to"`
	Type string `yaml:"type"`
}

type Infrastructure struct {
	Entities    []Entity     `yaml:"entities"`
	Connections []Connection `yaml:"connections"`
}

// Style configuration structures
type GraphConfig struct {
	Direction  string `yaml:"direction"`
	FontFamily string `yaml:"font_family"`
	NodeShape  string `yaml:"node_shape"`
}

type ConnectionStyle struct {
	Style string `yaml:"style"`
	Color string `yaml:"color"`
}

type CategoryConfig struct {
	DisplayName  string `yaml:"display_name"`
	ClusterStyle string `yaml:"cluster_style"`
}

type NodeConfig struct {
	MaxDescriptionLength int    `yaml:"max_description_length"`
	TruncationSuffix     string `yaml:"truncation_suffix"`
	BorderWidth          int    `yaml:"border_width"`
	CellBorder           int    `yaml:"cell_border"`
	CellSpacing          int    `yaml:"cell_spacing"`
	StatusBarHeight      int    `yaml:"status_bar_height"`
}

type TooltipConfig struct {
	IncludeStatus      bool `yaml:"include_status"`
	IncludeOwner       bool `yaml:"include_owner"`
	IncludeEnvironment bool `yaml:"include_environment"`
	IncludeTags        bool `yaml:"include_tags"`
	IncludeDeployment  bool `yaml:"include_deployment"`
}

type StyleConfig struct {
	Graph            GraphConfig                `yaml:"graph"`
	StatusColors     map[string]string          `yaml:"status_colors"`
	ConnectionStyles map[string]ConnectionStyle `yaml:"connection_styles"`
	Categories       map[string]CategoryConfig  `yaml:"categories"`
	Node             NodeConfig                 `yaml:"node"`
	Tooltip          TooltipConfig              `yaml:"tooltip"`
}

// Application configuration
type Config struct {
	StyleFile          string
	InfrastructureFile string
	OutputFile         string
	OutputToStdout     bool
	GeneratePNG        bool
	PNGFile            string
}

func main() {
	var (
		inputFile  = flag.String("input", "infra.yml", "Infrastructure YAML file")
		styleFile  = flag.String("style", "style.yml", "Style configuration file")
		outputFile = flag.String("output", "", "Output DOT file (default: stdout)")
		pngFile    = flag.String("png", "", "Generate PNG file using Graphviz")
		help       = flag.Bool("help", false, "Show help message")
	)

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Gorph - Infrastructure visualization tool\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  %s -input infra.yml                    # Output DOT to stdout\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -input infra.yml -output out.dot   # Output DOT to file\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -input infra.yml -png diagram.png  # Generate PNG directly\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -input infra.yml -output out.dot -png out.png  # Generate both\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s -input infra.yml | dot -Tpng > diagram.png  # Pipe to graphviz\n", os.Args[0])
	}

	flag.Parse()

	if *help {
		flag.Usage()
		os.Exit(0)
	}

	config := Config{
		StyleFile:          *styleFile,
		InfrastructureFile: *inputFile,
		OutputFile:         *outputFile,
		OutputToStdout:     *outputFile == "" && *pngFile == "",
		GeneratePNG:        *pngFile != "",
		PNGFile:            *pngFile,
	}

	// Load style configuration
	styleConfig, err := loadStyleConfig(config.StyleFile)
	if err != nil {
		log.Fatalf("Error loading style config: %v", err)
	}

	// Load infrastructure definition
	infra, err := loadInfrastructure(config.InfrastructureFile)
	if err != nil {
		log.Fatalf("Error reading infrastructure YAML: %v", err)
	}

	// Generate DOT output
	generator := NewDOTGenerator(styleConfig)
	dotOutput := generator.Generate(infra)

	// Handle DOT output
	if config.OutputToStdout {
		fmt.Print(dotOutput)
	} else if config.OutputFile != "" {
		if err := ioutil.WriteFile(config.OutputFile, []byte(dotOutput), 0644); err != nil {
			log.Fatalf("Error writing DOT file: %v", err)
		}
		fmt.Fprintf(os.Stderr, "Graphviz DOT file generated: %s\n", config.OutputFile)
	}

	// Handle PNG generation
	if config.GeneratePNG {
		if err := generatePNG(dotOutput, config.PNGFile); err != nil {
			log.Fatalf("Error generating PNG: %v", err)
		}
		fmt.Fprintf(os.Stderr, "PNG diagram generated: %s\n", config.PNGFile)
	}
}

func generatePNG(dotContent string, outputPath string) error {
	// Check if dot command is available
	if _, err := exec.LookPath("dot"); err != nil {
		return fmt.Errorf("Graphviz 'dot' command not found. Please install Graphviz: %w", err)
	}

	// Create output directory if it doesn't exist
	if dir := filepath.Dir(outputPath); dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("creating output directory: %w", err)
		}
	}

	// Execute dot command
	cmd := exec.Command("dot", "-Tpng", "-o", outputPath)
	cmd.Stdin = strings.NewReader(dotContent)

	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("running dot command: %w\nOutput: %s", err, string(output))
	}

	return nil
}

func loadStyleConfig(filepath string) (*StyleConfig, error) {
	data, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("reading style config file: %w", err)
	}

	var config StyleConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("parsing style config: %w", err)
	}

	return &config, nil
}

func loadInfrastructure(filepath string) (*Infrastructure, error) {
	data, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("reading infrastructure file: %w", err)
	}

	var infra Infrastructure
	if err := yaml.Unmarshal(data, &infra); err != nil {
		return nil, fmt.Errorf("parsing infrastructure YAML: %w", err)
	}

	return &infra, nil
}

// DOT Generator with style configuration
type DOTGenerator struct {
	style *StyleConfig
}

func NewDOTGenerator(style *StyleConfig) *DOTGenerator {
	return &DOTGenerator{style: style}
}

func (g *DOTGenerator) Generate(infra *Infrastructure) string {
	var sb strings.Builder

	// Graph header with configuration
	sb.WriteString("digraph Infrastructure {\n")
	sb.WriteString(fmt.Sprintf("  rankdir=%s;\n", g.style.Graph.Direction))
	sb.WriteString(fmt.Sprintf("  node [shape=%s, fontname=%s];\n",
		g.style.Graph.NodeShape, g.style.Graph.FontFamily))

	// Group entities by category
	categories := g.groupEntitiesByCategory(infra.Entities)

	// Generate clusters for each category
	for category, entities := range categories {
		g.generateCluster(&sb, category, entities)
	}

	// Generate connections
	for _, conn := range infra.Connections {
		g.generateConnection(&sb, conn)
	}

	sb.WriteString("}\n")
	return sb.String()
}

func (g *DOTGenerator) groupEntitiesByCategory(entities []Entity) map[string][]Entity {
	categories := make(map[string][]Entity)
	for _, e := range entities {
		categories[e.Category] = append(categories[e.Category], e)
	}
	return categories
}

func (g *DOTGenerator) generateCluster(sb *strings.Builder, category string, entities []Entity) {
	displayName := g.getCategoryDisplayName(category)

	sb.WriteString(fmt.Sprintf("  subgraph cluster_%s {\n", category))
	sb.WriteString(fmt.Sprintf("    label=\"%s\";\n", displayName))

	for _, entity := range entities {
		g.generateEntityNode(sb, entity)
	}

	sb.WriteString("  }\n")
}

func (g *DOTGenerator) getCategoryDisplayName(category string) string {
	if config, exists := g.style.Categories[category]; exists && config.DisplayName != "" {
		return config.DisplayName
	}
	// Fallback to title case transformation
	return strings.Title(strings.ToLower(category))
}

func (g *DOTGenerator) generateEntityNode(sb *strings.Builder, entity Entity) {
	tooltip := g.generateTooltip(entity)
	description := g.truncateDescription(entity.Description)
	statusColor := g.getStatusColor(entity.Status)

	sb.WriteString(fmt.Sprintf(`    %s [tooltip="%s" label=<
      <TABLE BORDER="%d" CELLBORDER="%d" CELLSPACING="%d">
        <TR><TD><B>%s</B></TD></TR>
        <TR><TD>%s</TD></TR>
        <TR><TD BGCOLOR="%s" HEIGHT="%d"></TD></TR>
      </TABLE>
    >];
`, entity.ID,
		sanitizeDOTLabel(tooltip),
		g.style.Node.BorderWidth,
		g.style.Node.CellBorder,
		g.style.Node.CellSpacing,
		entity.ID,
		description,
		statusColor,
		g.style.Node.StatusBarHeight))
}

func (g *DOTGenerator) generateTooltip(entity Entity) string {
	var parts []string

	parts = append(parts, fmt.Sprintf("%s: %s", entity.ID, entity.Description))

	if g.style.Tooltip.IncludeStatus {
		parts = append(parts, fmt.Sprintf("Status: %s", entity.Status))
	}

	if g.style.Tooltip.IncludeOwner {
		parts = append(parts, fmt.Sprintf("Owner: %s", entity.Owner))
	}

	if g.style.Tooltip.IncludeEnvironment && entity.Environment != "" {
		parts = append(parts, fmt.Sprintf("Environment: %s", entity.Environment))
	}

	if g.style.Tooltip.IncludeTags && len(entity.Tags) > 0 {
		parts = append(parts, fmt.Sprintf("Tags: %v", entity.Tags))
	}

	if g.style.Tooltip.IncludeDeployment && len(entity.DeploymentConfig) > 0 {
		deploymentYAML, _ := yaml.Marshal(entity.DeploymentConfig)
		parts = append(parts, fmt.Sprintf("Deployment:\n%s", string(deploymentYAML)))
	}

	return strings.Join(parts, "\n")
}

func (g *DOTGenerator) truncateDescription(desc string) string {
	if len(desc) > g.style.Node.MaxDescriptionLength {
		return desc[:g.style.Node.MaxDescriptionLength] + g.style.Node.TruncationSuffix
	}
	return desc
}

func (g *DOTGenerator) getStatusColor(status string) string {
	if color, exists := g.style.StatusColors[strings.ToLower(status)]; exists {
		return color
	}
	return g.style.StatusColors["unknown"]
}

func (g *DOTGenerator) generateConnection(sb *strings.Builder, conn Connection) {
	edgeAttrs := g.getConnectionAttributes(conn.Type)

	sb.WriteString(fmt.Sprintf("  %s -> %s [label=\"%s\"%s];\n",
		conn.From, conn.To, conn.Type, edgeAttrs))
}

func (g *DOTGenerator) getConnectionAttributes(connType string) string {
	style, exists := g.style.ConnectionStyles[connType]
	if !exists {
		return ""
	}

	var attrs []string

	if style.Color != "" {
		attrs = append(attrs, fmt.Sprintf("color=%s", style.Color))
	}

	if style.Style != "" {
		attrs = append(attrs, fmt.Sprintf("style=%s", style.Style))
	}

	if len(attrs) == 0 {
		return ""
	}

	return ", " + strings.Join(attrs, ", ")
}

func sanitizeDOTLabel(input string) string {
	replacer := strings.NewReplacer(
		"\"", "\\\"",
		"\n", "\\n",
		"{", "\\{",
		"}", "\\}",
		"<", "\\<",
		">", "\\>",
		"|", "\\|",
	)
	return replacer.Replace(input)
}
