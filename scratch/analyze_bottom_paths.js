const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/logo/logoanimate.svg');
const svgText = fs.readFileSync(svgPath, 'utf8');

const matches = svgText.match(/<path[^>]+>/g) || [];

// Let's parse all paths and extract their absolute coordinates
const allPoints = [];

matches.forEach((tag, idx) => {
  const dMatch = tag.match(/d="([^"]+)"/);
  if (!dMatch) return;
  const d = dMatch[1];
  
  const coords = [];
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    coords.push(parseFloat(match[0]));
  }

  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      allPoints.push({ x: coords[i], y: coords[i+1], pathIndex: idx });
    }
  }
});

// Filter points that are in the bottom panel (Y > 260)
const bottomPoints = allPoints.filter(p => p.y > 260);

// Find the extreme points (convex hull or just bounding polygon corners)
console.log(`Found ${bottomPoints.length} points in the bottom panel (Y > 260)`);

// Let's print out the min and max X for various Y ranges, or sort them to see the corners
const sortedByX = [...bottomPoints].sort((a, b) => a.x - b.x);
const sortedByY = [...bottomPoints].sort((a, b) => a.y - b.y);

console.log("Leftmost points:");
console.log(sortedByX.slice(0, 10));

console.log("Rightmost points:");
console.log(sortedByX.slice(-10));

console.log("Topmost bottom points:");
console.log(sortedByY.slice(0, 10));

console.log("Bottommost bottom points:");
console.log(sortedByY.slice(-10));
