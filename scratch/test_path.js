// Test outline path matching with basePaths bounding box
const baseOutline = "M 175 323 L 319 274 C 325 272 331 273 334 278 L 366 326 C 370 332 371 333 361 335 L 209 370 C 203 371 198 372 194 365 L 170 333 C 167 329 163 327 175 323 Z";

// Parse coordinates
const coords = [];
const regex = /[-+]?[0-9]*\.?[0-9]+/g;
let match;
while ((match = regex.exec(baseOutline)) !== null) {
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

console.log("Outline bounding box:");
console.log(`Min X: ${minX}, Max X: ${maxX}`);
console.log(`Min Y: ${minY}, Max Y: ${maxY}`);
