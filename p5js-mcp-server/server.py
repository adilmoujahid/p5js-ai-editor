#!/usr/bin/env python3
"""
p5.js MCP Server

A Model Context Protocol server for p5.js development, providing tools and resources
for creative coding assistance, project management, and p5.js-specific functionality.
"""

import json
import os
from typing import Dict, List, Any
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

# Create the MCP server
mcp = FastMCP("p5js-ai-editor")


class P5JSProjectFile(BaseModel):
    """Represents a p5.js project file"""
    name: str
    content: str
    type: str = "js"


class P5JSProject(BaseModel):
    """Represents a p5.js project"""
    id: str
    name: str
    files: List[P5JSProjectFile]
    description: str = ""


# Sample p5.js code templates
P5JS_TEMPLATES = {
    "basic": """function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(255, 0, 0);
  ellipse(mouseX, mouseY, 50, 50);
}""",
    
    "animation": """let angle = 0;

function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(220);
  
  translate(width/2, height/2);
  rotate(angle);
  
  fill(angle % 360, 80, 90);
  rectMode(CENTER);
  rect(0, 0, 100, 100);
  
  angle += 0.02;
}""",
    
    "interactive": """let particles = [];

function setup() {
  createCanvas(800, 600);
  
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(5, 15)
    });
  }
}

function draw() {
  background(0, 20);
  
  for (let p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    
    fill(255, 100);
    noStroke();
    ellipse(p.x, p.y, p.size);
  }
}

function mousePressed() {
  particles.push({
    x: mouseX,
    y: mouseY,
    vx: random(-3, 3),
    vy: random(-3, 3),
    size: random(10, 20)
  });
}""",
    
    "3d": """function setup() {
  createCanvas(600, 600, WEBGL);
}

function draw() {
  background(50);
  
  lights();
  
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.005);
  
  fill(255, 100, 100);
  box(200);
  
  translate(250, 0, 0);
  fill(100, 255, 100);
  sphere(80);
}""",
    
    "sound": """let mic;
let vol = 0;

function setup() {
  createCanvas(400, 400);
  
  // Create an audio input
  mic = new p5.AudioIn();
  mic.start();
}

function draw() {
  background(220);
  
  // Get the overall volume (between 0 and 1.0)
  vol = mic.getLevel();
  
  // Map volume to circle size
  let circleSize = map(vol, 0, 1, 50, 400);
  
  fill(255, 0, 0, 100);
  noStroke();
  ellipse(width/2, height/2, circleSize, circleSize);
  
  // Display volume level
  fill(0);
  textAlign(CENTER);
  text('Volume: ' + vol.toFixed(2), width/2, 50);
}""",
    
    "generative": """function setup() {
  createCanvas(800, 800);
  background(255);
  noLoop();
  
  generateArt();
}

function generateArt() {
  for (let i = 0; i < 1000; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(2, 20);
    
    // Use noise for organic randomness
    let noiseScale = 0.01;
    let alpha = noise(x * noiseScale, y * noiseScale) * 255;
    
    fill(random(255), random(255), random(255), alpha);
    noStroke();
    ellipse(x, y, size, size);
  }
}

function mousePressed() {
  background(255);
  generateArt();
}"""
}

# p5.js function documentation
P5JS_FUNCTIONS = {
    "createCanvas": {
        "description": "Creates a canvas element and adds it to the DOM",
        "syntax": "createCanvas(width, height, [renderer])",
        "example": "createCanvas(400, 400); // Creates a 400x400 pixel canvas"
    },
    "background": {
        "description": "Sets the background color of the canvas",
        "syntax": "background(color) or background(r, g, b, [a])",
        "example": "background(220); // Light gray background"
    },
    "fill": {
        "description": "Sets the color used to fill shapes",
        "syntax": "fill(color) or fill(r, g, b, [a])",
        "example": "fill(255, 0, 0); // Red fill"
    },
    "ellipse": {
        "description": "Draws an ellipse (oval) to the screen",
        "syntax": "ellipse(x, y, width, [height])",
        "example": "ellipse(50, 50, 80, 80); // Circle at (50,50) with diameter 80"
    },
    "rect": {
        "description": "Draws a rectangle to the screen",
        "syntax": "rect(x, y, width, height, [tl], [tr], [br], [bl])",
        "example": "rect(30, 20, 55, 55); // Rectangle at (30,20) with size 55x55"
    }
}


@mcp.tool()
def generate_p5js_code(template: str = "basic", custom_description: str = "") -> str:
    """
    Generate p5.js code based on templates or custom descriptions.
    
    Args:
        template: Choose from 'basic', 'animation', 'interactive', '3d', 'sound', 'generative'
        custom_description: Optional description for custom code generation
    
    Returns:
        Generated p5.js code
    """
    if template in P5JS_TEMPLATES:
        code = P5JS_TEMPLATES[template]
        if custom_description:
            code = f"// {custom_description}\n\n{code}"
        return code
    else:
        # For custom descriptions, we'll provide a basic template with comments
        if custom_description:
            return f"""// {custom_description}
// TODO: Implement the specific functionality described above

function setup() {{
  createCanvas(400, 400);
  // Initialize your variables and settings here
}}

function draw() {{
  background(220);
  // Add your drawing code here
  // This function runs continuously in a loop
}}

// Add event handlers if needed:
// function mousePressed() {{ }}
// function keyPressed() {{ }}"""
        else:
            return P5JS_TEMPLATES["basic"]


@mcp.tool()
def get_p5js_function_help(function_name: str) -> str:
    """
    Get help documentation for p5.js functions.
    
    Args:
        function_name: Name of the p5.js function to get help for
    
    Returns:
        Documentation for the function including syntax and examples
    """
    if function_name in P5JS_FUNCTIONS:
        func_info = P5JS_FUNCTIONS[function_name]
        return f"""Function: {function_name}

Description: {func_info['description']}

Syntax: {func_info['syntax']}

Example: {func_info['example']}

For more detailed documentation, visit: https://p5js.org/reference/#{function_name}"""
    else:
        return f"""Function '{function_name}' not found in quick reference.

Try these common p5.js functions:
- createCanvas, background, fill, stroke, noFill, noStroke
- ellipse, rect, line, point, triangle
- translate, rotate, scale, push, pop
- mouseX, mouseY, mousePressed, keyPressed
- random, noise, map, constrain

Visit https://p5js.org/reference/ for complete documentation."""


@mcp.tool()
def analyze_p5js_code(code: str) -> str:
    """
    Analyze p5.js code for common issues and provide suggestions.
    
    Args:
        code: The p5.js code to analyze
    
    Returns:
        Analysis results and suggestions
    """
    issues = []
    suggestions = []
    
    # Check for common issues
    if "setup()" not in code:
        issues.append("Missing setup() function - required for p5.js sketches")
    
    if "draw()" not in code:
        suggestions.append("Consider adding a draw() function for animation")
    
    if "createCanvas" not in code:
        issues.append("Missing createCanvas() call - needed to create a drawing surface")
    
    if code.count("(") != code.count(")"):
        issues.append("Mismatched parentheses - check your function calls")
    
    if code.count("{") != code.count("}"):
        issues.append("Mismatched curly braces - check your code blocks")
    
    # Check for performance considerations
    if "createCanvas" in code and "draw()" in code:
        if code.count("createCanvas") > 1:
            issues.append("createCanvas() should only be called once, typically in setup()")
    
    # Provide positive feedback
    if "mouseX" in code or "mouseY" in code:
        suggestions.append("Great! You're using mouse interaction")
    
    if "random(" in code:
        suggestions.append("Nice use of randomness for creative effects")
    
    if "frameCount" in code:
        suggestions.append("Using frameCount for animation - excellent!")
    
    # Format the response
    result = "Code Analysis Results:\n\n"
    
    if issues:
        result += "Issues Found:\n"
        for i, issue in enumerate(issues, 1):
            result += f"{i}. {issue}\n"
        result += "\n"
    
    if suggestions:
        result += "Suggestions:\n"
        for i, suggestion in enumerate(suggestions, 1):
            result += f"{i}. {suggestion}\n"
        result += "\n"
    
    if not issues and not suggestions:
        result += "Code looks good! No obvious issues found.\n\n"
    
    result += "For more help, visit: https://p5js.org/learn/"
    
    return result


@mcp.tool()
def create_p5js_project(name: str, template: str = "basic", description: str = "") -> str:
    """
    Create a new p5.js project structure.
    
    Args:
        name: Name of the project
        template: Template to use ('basic', 'animation', 'interactive', '3d', 'sound', 'generative')
        description: Optional project description
    
    Returns:
        JSON representation of the created project
    """
    # Generate the main sketch file
    sketch_code = generate_p5js_code(template, description)
    
    # Create project structure
    project = P5JSProject(
        id=name.lower().replace(" ", "-"),
        name=name,
        description=description or f"p5.js project using {template} template",
        files=[
            P5JSProjectFile(
                name="sketch.js",
                content=sketch_code,
                type="js"
            ),
            P5JSProjectFile(
                name="index.html",
                content=f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
</head>
<body>
    <main>
        <h1>{name}</h1>
        <p>{description or 'A p5.js creative coding project'}</p>
    </main>
    <script src="sketch.js"></script>
</body>
</html>""",
                type="html"
            )
        ]
    )
    
    return project.model_dump_json(indent=2)


# Resources for p5.js documentation and examples
@mcp.resource("p5js://reference/{function_name}")
def get_p5js_reference(function_name: str) -> str:
    """Get p5.js function reference documentation"""
    return get_p5js_function_help(function_name)


@mcp.resource("p5js://template/{template_name}")
def get_p5js_template(template_name: str) -> str:
    """Get p5.js code templates"""
    if template_name in P5JS_TEMPLATES:
        return P5JS_TEMPLATES[template_name]
    else:
        available = ", ".join(P5JS_TEMPLATES.keys())
        return f"Template '{template_name}' not found. Available templates: {available}"


@mcp.resource("p5js://examples")
def get_p5js_examples() -> str:
    """Get a list of available p5.js examples and templates"""
    examples = {
        "templates": list(P5JS_TEMPLATES.keys()),
        "descriptions": {
            "basic": "Simple mouse-following circle",
            "animation": "Rotating square with HSB colors",
            "interactive": "Particle system with mouse interaction",
            "3d": "3D rotating shapes using WEBGL",
            "sound": "Audio-reactive visualization",
            "generative": "Generative art with randomness and noise"
        }
    }
    return json.dumps(examples, indent=2)


if __name__ == "__main__":
    # Run the server
    mcp.run() 