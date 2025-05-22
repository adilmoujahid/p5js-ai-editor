export const DEFAULT_P5_TEMPLATE = `function setup() {
  createCanvas(400, 400);
  background(240);
}

function draw() {
  // Draw a circle that follows the mouse
  fill(237, 34, 93);
  noStroke();
  ellipse(mouseX, mouseY, 60, 60);
}`;

export const EMPTY_P5_TEMPLATE = `function setup() {
  createCanvas(400, 400);
  background(240);
}

function draw() {
  // Your code goes here
}`;

export const createP5Frame = (code: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          canvas {
            display: block;
          }
        </style>
      </head>
      <body>
        <script>
          ${code}
        </script>
      </body>
    </html>
  `;
}; 