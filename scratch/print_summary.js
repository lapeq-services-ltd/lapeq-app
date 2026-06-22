const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\committed_diaspora.tsx', 'utf8');
const lines = content.split('\n');
console.log(`Committed file has ${lines.length} lines.`);
console.log("Lines 1-20:");
console.log(lines.slice(0, 20).join('\n'));
console.log("\nLines 100-120:");
console.log(lines.slice(100, 120).join('\n'));
