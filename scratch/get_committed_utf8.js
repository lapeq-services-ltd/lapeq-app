const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch';
const buffer = execSync('git show HEAD:app/services/diaspora-support.tsx', { maxBuffer: 10 * 1024 * 1024 });

fs.writeFileSync(path.join(targetDir, 'committed_diaspora_utf8.tsx'), buffer);
console.log("Successfully extracted UTF-8 committed file.");
