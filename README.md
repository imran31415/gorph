# 📊 Infrastructure Visualizer (Graphviz-based)

**Turn a simple YAML file into beautiful, interactive infrastructure diagrams.**  
Lightweight. Portable. Zero dependencies (just Go + Graphviz).

---

## 🚀 Why Use This?

✅ **Instant Diagrams** from your infrastructure metadata  
✅ **Fully Customizable**: categories, connections, statuses, teams  
✅ **Web-Friendly**: generates DOT files ready for SVG/HTML rendering  
✅ **Low Weight**: one Go file, one YAML file — done.

---

## 🖼️ Example Outputs

<table>
  <tr>
    <td><b>System Architecture</b></td>
    <td><b>Deployment Pipeline</b></td>
  </tr>
  <tr>
    <td><img width="1429" height="518" alt="image" src="https://github.com/user-attachments/assets/7565eac7-09c5-4bd8-9c18-8293b727c77b" />
</td>
    <td> Comming soon! </td>
  </tr>
</table>

> Diagrams include subclusters, status bars, colored edges, and tooltips — all from a single YAML file.

---

## 🧩 Input: YAML Specification

```yaml
- id: APIServer
  category: BACKEND
  description: "Core API service"
  status: degraded
  owner: core-team
  environment: production
  tags: [critical]
  ...
```

Connections:

```yaml
- from: WebApp
  to: APIServer
  type: HTTP_Request
```

---

## ⚙️ Output: Clean Graphviz `.dot` file

The Go script produces a file called `output.dot`, which you can render using:

```bash
dot -Tsvg output.dot -o output.svg
```

Or for PNG:

```bash
dot -Tpng output.dot -o output.png
```

---

## 🛠 Usage

1. ✅ Install [Graphviz](https://graphviz.org/download/)
2. ✅ Clone this repo
3. ✅ Run the script:

```bash
go run main.go
```

4. ✅ Render the diagram:

```bash
dot -Tsvg output.dot -o diagram.svg
```

---

## 📂 Folder Structure

```
.
├── main.go               # Generator logic
├── infra.yml             # Infra model
├── deployment.yml        # Deployment pipeline model
├── output.dot            # Generated DOT file
├── output.svg            # Optional rendered file
└── images/
    ├── infra-example.svg
    └── deploy-pipeline.svg
```

---

## 📌 Features

- ⚡ HTML-style status bars (green/yellow/red) in each node
- 📦 Custom tooltips and environment metadata
- 🧠 Intelligent color-coding by status or category
- 🌐 Ready for web integration via SVG

---

## 🧪 Coming Soon

- Web viewer using Viz.js
- Mermaid.js export option
- Live editor playground
- Team ownership overlays

---

## 📧 Contributing / Feedback

PRs welcome!  
Submit improvements or issues via GitHub.

---

## 📜 License

MIT — use freely.
