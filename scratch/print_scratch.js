const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const files = fs.readdirSync(dir);

console.log("All files in scratch:");
files.forEach(f => {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`- ${f} (${stat.size} bytes)`);
});
