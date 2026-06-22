const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch';
const workspaceDir = 'C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch';

// 1. Read clean committed diaspora-support.tsx (UTF-8)
const baseFile = path.join(workspaceDir, 'committed_diaspora_utf8.tsx');
if (!fs.existsSync(baseFile)) {
  console.error("committed_diaspora_utf8.tsx not found.");
  process.exit(1);
}

let code = fs.readFileSync(baseFile, 'utf8');
console.log(`Base code length: ${code.length} characters.`);

// List of json replacement files in chronological order
const steps = [1200, 1204, 1244, 1313, 1319, 1325, 1399, 1404, 1419, 1423, 1494];

for (const step of steps) {
  let repPath = path.join(brainDir, `rep_${step}.json`);
  if (!fs.existsSync(repPath)) {
    repPath = path.join(workspaceDir, `rep_${step}.json`);
  }
  
  if (!fs.existsSync(repPath)) {
    console.log(`Warning: rep_${step}.json not found in either scratch directory, skipping.`);
    continue;
  }
  
  const repData = JSON.parse(fs.readFileSync(repPath, 'utf8'));
  console.log(`Applying step ${step} from ${repPath}...`);
  
  if (repData.ReplacementChunks) {
    // Multi replacement
    for (const chunk of repData.ReplacementChunks) {
      const target = chunk.TargetContent;
      const replacement = chunk.ReplacementContent;
      if (!code.includes(target)) {
        console.error(`Error: Target content not found in code for step ${step} chunk!`);
        process.exit(1);
      }
      code = code.replace(target, replacement);
    }
  } else {
    // Single replacement
    const target = repData.TargetContent;
    const replacement = repData.ReplacementContent;
    if (!code.includes(target)) {
      console.error(`Error: Target content not found in code for step ${step}!`);
      // Print first 200 chars of target to debug
      console.log("Target expected (first 200 chars):", JSON.stringify(target.slice(0, 200)));
      process.exit(1);
    }
    code = code.replace(target, replacement);
  }
}

const outputPath = path.join(workspaceDir, 'reconstructed_diaspora_support.tsx');
fs.writeFileSync(outputPath, code, 'utf8');
console.log(`Successfully reconstructed file and saved to ${outputPath}`);
