const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const files = fs.readdirSync(targetDir).filter(f => f.startsWith('full_recovered_'));

for (const file of files) {
  const filePath = path.join(targetDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`File: ${file} | Line count: ${lines.length} | Size: ${content.length} bytes`);
  console.log("First 3 lines:\n" + lines.slice(0, 3).join('\n'));
  console.log("Last 3 lines:\n" + lines.slice(-3).join('\n'));
  console.log("------------------------------------------");
}
