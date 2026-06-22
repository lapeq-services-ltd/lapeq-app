const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/logo/logoanimate.svg');
const svgText = fs.readFileSync(svgPath, 'utf8');

const matches = svgText.match(/<path[^>]+>/g) || [];

const baseIndices = [];
const vertIndices = [];

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

  const xs = [];
  const ys = [];
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      xs.push(coords[i]);
      ys.push(coords[i+1]);
    }
  }

  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  // If a path goes to the right of X=242, it is part of the horizontal base panel
  if (maxX > 242) {
    baseIndices.push(idx);
  } else {
    vertIndices.push(idx);
  }
});

console.log("Base panel indices:", JSON.stringify(baseIndices));
console.log("Vertical panel indices:", JSON.stringify(vertIndices));
