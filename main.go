package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"strings"

	"gopkg.in/yaml.v3"
)

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

func main() {
	infra, err := readYAML("infra.yml")
	if err != nil {
		log.Fatalf("Error reading YAML: %v", err)
	}

	dotOutput := generateDOT(infra)
	if err := ioutil.WriteFile("output.dot", []byte(dotOutput), 0644); err != nil {
		log.Fatalf("Error writing DOT file: %v", err)
	}
	fmt.Println("Graphviz DOT file generated: output.dot")
}

func readYAML(filepath string) (*Infrastructure, error) {
	data, err := ioutil.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	var infra Infrastructure
	if err := yaml.Unmarshal(data, &infra); err != nil {
		return nil, err
	}

	return &infra, nil
}

func generateDOT(infra *Infrastructure) string {
	var sb strings.Builder

	sb.WriteString("digraph Infrastructure {\n")
	sb.WriteString("  rankdir=LR;\n")
	sb.WriteString("  node [shape=plaintext, fontname=Helvetica];\n")

	statusColors := map[string]string{
		"healthy":  "green",
		"degraded": "yellow",
		"down":     "red",
	}

	categories := make(map[string][]Entity)
	for _, e := range infra.Entities {
		categories[e.Category] = append(categories[e.Category], e)
	}

	for category, entities := range categories {
		sb.WriteString(fmt.Sprintf("  subgraph cluster_%s {\n", category))
		sb.WriteString(fmt.Sprintf("    label=\"%s\";\n", strings.Title(strings.ToLower(category))))
		for _, entity := range entities {
			deploymentYAML, _ := yaml.Marshal(entity.DeploymentConfig)
			tooltip := sanitizeDOTLabel(fmt.Sprintf("%s: %s\nStatus: %s\nOwner: %s\nEnvironment: %s\nTags: %v\nDeployment:\n%s",
				entity.ID, entity.Description, entity.Status, entity.Owner, entity.Environment, entity.Tags, string(deploymentYAML)))

			desc := entity.Description
			if len(desc) > 24 {
				desc = desc[:24] + "..."
			}
			statusColor := statusColors[strings.ToLower(entity.Status)]
			if statusColor == "" {
				statusColor = "lightgray"
			}

			sb.WriteString(fmt.Sprintf(`    %s [tooltip="%s" label=<
      <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0">
        <TR><TD><B>%s</B></TD></TR>
        <TR><TD>%s</TD></TR>
        <TR><TD BGCOLOR="%s" HEIGHT="8"></TD></TR>
      </TABLE>
    >];
`, entity.ID, tooltip, entity.ID, desc, statusColor))
		}
		sb.WriteString("  }\n")
	}

	for _, conn := range infra.Connections {
		edgeAttrs := ""
		if conn.Type == "API_Call" {
			edgeAttrs = "style=dashed, color=orange"
		} else if conn.Type == "Internal_API" {
			edgeAttrs = "style=dotted, color=gray"
		} else if conn.Type == "DB_Connection" {
			edgeAttrs = "color=blue"
		}
		sb.WriteString(fmt.Sprintf("  %s -> %s [label=\"%s\"%s];\n",
			conn.From, conn.To, conn.Type, formatEdgeAttributes(edgeAttrs)))
	}

	sb.WriteString("}\n")
	return sb.String()
}

func formatEdgeAttributes(attrs string) string {
	if attrs == "" {
		return ""
	}
	return ", " + attrs
}