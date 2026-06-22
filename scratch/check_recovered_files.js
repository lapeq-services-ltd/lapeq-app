const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const files = fs.readdirSync(targetDir).filter(f => f.startsWith('full_recovered_') || f.startsWith('recovered_') || f.startsWith('replacement_'));

console.log(`Checking ${files.length} recovered files...`);

for (const file of files) {
  const filePath = path.join(targetDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`\n==================================================`);
  console.log(`File: ${file} | Lines: ${lines.length} | Size: ${content.length} bytes`);
  console.log(`==================================================`);
  console.log("FIRST 5 LINES:");
  console.log(lines.slice(0, 5).join('\n'));
  console.log("LAST 5 LINES:");
  console.log(lines.slice(-5).join('\n'));
}
