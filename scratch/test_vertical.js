const verticalOutline = "M 158 141 L 228 124 C 234 123 238 126 238 132 L 236 262 C 236 268 232 271 226 272 L 150 293 C 144 294 140 291 140 285 L 141 151 C 141 145 145 142 158 141 Z";

const coords = [];
const regex = /[-+]?[0-9]*\.?[0-9]+/g;
let match;
while ((match = regex.exec(verticalOutline)) !== null) {
  coords.push(parseFloat(match[0]));
}

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

console.log("Vertical Outline bounding box:");
console.log(`Min X: ${minX}, Max X: ${maxX}`);
console.log(`Min Y: ${minY}, Max Y: ${maxY}`);
