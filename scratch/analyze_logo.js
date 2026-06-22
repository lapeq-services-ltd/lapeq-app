const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/logo/logoanimate.svg');
const svgText = fs.readFileSync(svgPath, 'utf8');

const matches = svgText.match(/<path[^>]+>/g) || [];
console.log(`Found ${matches.length} paths`);

// Parse SVG paths and print their min/max coordinates
const pathsInfo = matches.map((tag, idx) => {
  const fillMatch = tag.match(/fill="([^"]+)"/);
  const dMatch = tag.match(/d="([^"]+)"/);
  if (!fillMatch || !dMatch) return null;

  const d = dMatch[1];
  const fill = fillMatch[1];

  // Simple parser to extract all numbers (coordinates) from path string
  const coords = [];
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    coords.push(parseFloat(match[0]));
  }

  // Group coordinates into x and y pairs
  // For most path commands, coordinates are alternating x, y. Let's just find min/max of all x (even indices) and y (odd indices)
  // Note: This is a rough estimation of bounding box
  const xs = [];
  const ys = [];
  for (let i = 0; i < coords.length; i += 2) {
    if (i < coords.length) xs.push(coords[i]);
    if (i + 1 < coords.length) ys.push(coords[i+1]);
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    index: idx,
    fill,
    d,
    coordsCount: coords.length,
    bbox: { minX, maxX, minY, maxY }
  };
}).filter(Boolean);

// Let's find distinct clusters or shapes
console.log("Paths Bounding Boxes Summary:");
pathsInfo.forEach(p => {
  console.log(`Path ${p.index}: fill=${p.fill}, coords=${p.coordsCount}, bbox=[x: ${p.bbox.minX}..${p.bbox.maxX}, y: ${p.bbox.minY}..${p.bbox.maxY}]`);
});
