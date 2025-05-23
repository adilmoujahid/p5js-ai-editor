# p5.js MCP Server

A Model Context Protocol (MCP) server specifically designed for p5.js creative coding assistance. This server provides AI tools with access to p5.js templates, documentation, code analysis, and project management capabilities.

## Features

### 🛠️ **Tools**

| Tool | Description | Usage |
|------|-------------|-------|
| `generate_p5js_code` | Generate p5.js code from templates or descriptions | Create new sketches with predefined patterns |
| `get_p5js_function_help` | Get documentation for p5.js functions | Look up function syntax and examples |
| `analyze_p5js_code` | Analyze code for issues and suggestions | Debug and improve existing code |
| `create_p5js_project` | Create complete project structures | Generate full project with HTML + JS files |

### 📚 **Resources**

| Resource | Description | URI Pattern |
|----------|-------------|-------------|
| Function Reference | p5.js function documentation | `p5js://reference/{function_name}` |
| Code Templates | Predefined code templates | `p5js://template/{template_name}` |
| Examples Catalog | List of available examples | `p5js://examples` |

### 🎨 **Templates Available**

- **basic**: Simple mouse-following circle
- **animation**: Rotating shapes with HSB colors  
- **interactive**: Particle system with mouse interaction
- **3d**: 3D rotating shapes using WEBGL
- **sound**: Audio-reactive visualization
- **generative**: Generative art with randomness and noise

## Installation

### Prerequisites
- Python 3.8+
- [uv](https://docs.astral.sh/uv/) package manager

### Setup

1. **Navigate to the MCP server directory**:
   ```bash
   cd p5js-mcp-server
   ```

2. **Install dependencies** (already done during setup):
   ```bash
   uv add "mcp[cli]"
   ```

## Usage

### Development Mode

Test the server with the MCP Inspector:

```bash
uv run mcp dev server.py
```

This opens an interactive inspector where you can:
- Test all available tools
- Browse resources  
- See real-time server logs

### Production Mode

Run the server directly:

```bash
uv run python server.py
```

### Integration with AI Tools

To use this server with Claude Desktop or other MCP-compatible clients, add it to your configuration:

```json
{
  "mcpServers": {
    "p5js-ai-editor": {
      "command": "uv",
      "args": ["run", "python", "/path/to/p5js-mcp-server/server.py"],
      "cwd": "/path/to/p5js-mcp-server"
    }
  }
}
```

## API Reference

### Tools

#### `generate_p5js_code(template, custom_description)`
Generate p5.js code based on templates or custom descriptions.

**Parameters:**
- `template` (str): Choose from 'basic', 'animation', 'interactive', '3d', 'sound', 'generative'
- `custom_description` (str, optional): Custom description for code generation

**Returns:** Generated p5.js code as a string

#### `get_p5js_function_help(function_name)`
Get help documentation for p5.js functions.

**Parameters:**
- `function_name` (str): Name of the p5.js function

**Returns:** Documentation with syntax and examples

#### `analyze_p5js_code(code)`
Analyze p5.js code for common issues and provide suggestions.

**Parameters:**
- `code` (str): The p5.js code to analyze

**Returns:** Analysis results and improvement suggestions

#### `create_p5js_project(name, template, description)`
Create a new p5.js project structure.

**Parameters:**
- `name` (str): Project name
- `template` (str): Template to use
- `description` (str, optional): Project description

**Returns:** JSON representation of the created project

### Resources

#### `p5js://reference/{function_name}`
Access documentation for specific p5.js functions.

#### `p5js://template/{template_name}`
Get code for specific templates.

#### `p5js://examples`
Get a catalog of all available examples and templates.

## Example Usage

### Generate Code
```python
# Basic template
code = generate_p5js_code("basic")

# Animation with custom description  
code = generate_p5js_code("animation", "A spinning rainbow square")
```

### Get Help
```python
# Get function documentation
help_text = get_p5js_function_help("createCanvas")
```

### Analyze Code
```python
# Check code for issues
analysis = analyze_p5js_code("""
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}
""")
```

### Create Project
```python
# Create a complete project
project_json = create_p5js_project(
    name="My Art Project",
    template="generative", 
    description="An interactive generative art piece"
)
```

## Development

### Adding New Templates

To add new p5.js templates, edit the `P5JS_TEMPLATES` dictionary in `server.py`:

```python
P5JS_TEMPLATES["my_template"] = """
// Your p5.js code here
function setup() {
  // setup code
}

function draw() {
  // drawing code
}
"""
```

### Adding Function Documentation

Add entries to the `P5JS_FUNCTIONS` dictionary:

```python
P5JS_FUNCTIONS["newFunction"] = {
    "description": "What the function does",
    "syntax": "newFunction(param1, param2)",
    "example": "newFunction(10, 20); // Example usage"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test with `uv run mcp dev server.py`
5. Submit a pull request

## License

This project follows the same MIT license as the main p5.js AI Editor project.
