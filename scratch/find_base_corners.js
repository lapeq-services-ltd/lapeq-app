const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/logo/logoanimate.svg');
const svgText = fs.readFileSync(svgPath, 'utf8');

const matches = svgText.match(/<path[^>]+>/g) || [];

const paths = matches.map((tag, idx) => {
  const dMatch = tag.match(/d="([^"]+)"/);
  if (!dMatch) return null;
  const d = dMatch[1];
  
  const coords = [];
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    coords.push(parseFloat(match[0]));
  }

  const xs = [];
  const ys = [];
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      xs.push(coords[i]);
      ys.push(coords[i+1]);
    }
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const avgX = xs.reduce((a,b)=>a+b, 0) / xs.length;
  const avgY = ys.reduce((a,b)=>a+b, 0) / ys.length;

  return {
    index: idx,
    avgX,
    avgY,
    minX,
    maxX,
    minY,
    maxY,
    points: xs.map((x, i) => ({ x, y: ys[i] }))
  };
}).filter(Boolean);

// Vertical panel paths are those on the left (maxX <= 242 and Y is mostly < 300, except the tail)
// Horizontal base panel paths are the ones extending to the right (maxX > 242)
const basePaths = paths.filter(p => p.maxX > 242);
const verticalPaths = paths.filter(p => p.maxX <= 242);

console.log(`Base panel paths: ${basePaths.length}, Vertical panel paths: ${verticalPaths.length}`);

// Gather all points of the base panel
const basePoints = [];
basePaths.forEach(p => basePoints.push(...p.points));

// Find corners of basePoints
// In 2D, the 4 corners of a skewed trapezoid would be:
// Top-Left corner: small X, small Y
// Top-Right corner: large X, small Y
// Bottom-Right corner: large X, large Y
// Bottom-Left corner: small X, large Y

// Let's print out points that minimize/maximize some combinations of x and y
// For example:
// Top-Left: minimize (x + y) or minimize x when y is small
// Top-Right: maximize (x - y) or maximize x when y is small
// Bottom-Right: maximize (x + y) or maximize x when y is large
// Bottom-Left: minimize (x - y) or minimize x when y is large

console.log("\nExtreme Point Candidates:");

// 1. Min X + Y (Top-Left candidates)
const sortedByTL = [...basePoints].sort((a, b) => (a.x + a.y) - (b.x + b.y));
console.log("Top-Left Candidates (min x+y):", sortedByTL.slice(0, 5));

// 2. Max X - Y (Top-Right candidates)
const sortedByTR = [...basePoints].sort((a, b) => (b.x - b.y) - (a.x - a.y));
console.log("Top-Right Candidates (max x-y):", sortedByTR.slice(0, 5));

// 3. Max X + Y (Bottom-Right candidates)
const sortedByBR = [...basePoints].sort((a, b) => (b.x + b.y) - (a.x + a.y));
console.log("Bottom-Right Candidates (max x+y):", sortedByBR.slice(0, 5));

// 4. Min X - Y (Bottom-Left candidates)
const sortedByBL = [...basePoints].sort((a, b) => (a.x - a.y) - (b.x - b.y));
console.log("Bottom-Left Candidates (min x-y):", sortedByBL.slice(0, 5));

// Gather all points of the vertical panel
const vertPoints = [];
verticalPaths.forEach(p => vertPoints.push(...p.points));

console.log("\nVertical Panel Extreme Point Candidates:");

// 1. Min X + Y (Top-Left candidates)
const sortedByVTL = [...vertPoints].sort((a, b) => (a.x + a.y) - (b.x + b.y));
console.log("Top-Left Candidates (min x+y):", sortedByVTL.slice(0, 5));

// 2. Max X - Y (Top-Right candidates)
const sortedByVTR = [...vertPoints].sort((a, b) => (b.x - b.y) - (a.x - a.y));
console.log("Top-Right Candidates (max x-y):", sortedByVTR.slice(0, 5));

// 3. Max X + Y (Bottom-Right candidates)
const sortedByVBR = [...vertPoints].sort((a, b) => (b.x + b.y) - (a.x + a.y));
console.log("Bottom-Right Candidates (max x+y):", sortedByVBR.slice(0, 5));

// 4. Min X - Y (Bottom-Left candidates)
const sortedByVBL = [...vertPoints].sort((a, b) => (a.x - a.y) - (b.x - b.y));
console.log("Bottom-Left Candidates (min x-y):", sortedByVBL.slice(0, 5));
