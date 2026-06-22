const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const workspaceDir = 'C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch';

const files = ['replacement_1319.txt', 'replacement_1419.txt'];

for (const file of files) {
  const src = path.join(brainDir, file);
  const dest = path.join(workspaceDir, 'full_' + file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to ${dest}`);
  } else {
    console.log(`File not found: ${src}`);
  }
}
