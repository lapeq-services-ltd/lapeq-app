const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const files = [
  'replacement_1313.txt',
  'replacement_1319.txt',
  'replacement_1325.txt',
  'replacement_1399.txt',
  'replacement_1404.txt',
  'replacement_1419.txt',
  'replacement_1423.txt',
  'replacement_1494.txt'
];

for (const file of files) {
  const filePath = path.join(targetDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n==================================================`);
    console.log(`File: ${file} (Length: ${content.length})`);
    console.log(`==================================================`);
    console.log(content);
  } else {
    console.log(`File: ${file} does not exist at: ${filePath}`);
  }
}
