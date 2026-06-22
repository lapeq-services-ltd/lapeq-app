const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const workspaceDir = 'C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch';

const steps = [1313, 1319, 1325, 1399, 1404, 1419, 1423, 1494];

for (const step of steps) {
  let repPath = path.join(scratchDir, `rep_${step}.json`);
  if (!fs.existsSync(repPath)) {
    repPath = path.join(workspaceDir, `rep_${step}.json`);
  }
  
  if (!fs.existsSync(repPath)) {
    console.log(`rep_${step}.json not found.`);
    continue;
  }
  
  const repData = JSON.parse(fs.readFileSync(repPath, 'utf8'));
  console.log(`\n==================================================`);
  console.log(`Step ${step} | Tool: ${repData.name || 'replace_file_content'}`);
  console.log(`==================================================`);
  if (repData.ReplacementChunks) {
    console.log("Chunks count:", repData.ReplacementChunks.length);
    repData.ReplacementChunks.forEach((c, idx) => {
      console.log(`Chunk ${idx + 1}:`);
      console.log(`  Target:\n${c.TargetContent}\n`);
      console.log(`  Replacement:\n${c.ReplacementContent}\n`);
    });
  } else {
    console.log(`Target:\n${repData.TargetContent}\n`);
    console.log(`Replacement:\n${repData.ReplacementContent}\n`);
  }
}
