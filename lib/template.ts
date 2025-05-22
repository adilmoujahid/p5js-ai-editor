export const DEFAULT_P5_TEMPLATE = `function setup() {
  createCanvas(800, 500);
  background(240);
}

function draw() {
  // Draw a circle that follows the mouse
  fill(237, 34, 93);
  noStroke();
  ellipse(mouseX, mouseY, 60, 60);
}`;

export const EMPTY_P5_TEMPLATE = `function setup() {
  createCanvas(800, 500);
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
            background-color: #f0f0f0;
            overflow: auto;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 10px;
            min-height: 100vh;
          }
          canvas {
            display: block;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          /* For very large canvases */
          .p5Canvas {
            max-width: none !important;
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