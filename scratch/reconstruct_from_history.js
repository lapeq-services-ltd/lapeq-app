const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.error("Log file does not exist at:", logPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

console.log("Scanning transcript.jsonl...");

let lastFullCode = null;
let currentCode = "";
let stepsApplied = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  try {
    const stepObj = JSON.parse(line);
    
    // Check if the step has tool calls
    if (stepObj.tool_calls) {
      for (const call of stepObj.tool_calls) {
        let args = call.args;
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch(e) {}
        }
        
        const target = args.TargetFile || args.Target || "";
        if (target.toLowerCase().includes('diaspora-support.tsx')) {
          console.log(`Step ${stepObj.step_index} (${stepObj.created_at}) - Tool: ${call.name}`);
          
          if (call.name === 'write_to_file') {
            if (args.CodeContent) {
              currentCode = args.CodeContent;
              lastFullCode = stepObj.step_index;
              stepsApplied.push(`write_to_file (Step ${stepObj.step_index})`);
              console.log(`  -> Wrote full file of length ${currentCode.length} characters.`);
            }
          } else if (call.name === 'replace_file_content') {
            const targetContent = args.TargetContent;
            const replacementContent = args.ReplacementContent;
            
            if (currentCode.includes(targetContent)) {
              currentCode = currentCode.replace(targetContent, replacementContent);
              stepsApplied.push(`replace_file_content (Step ${stepObj.step_index})`);
              console.log(`  -> Applied replacement (len: ${replacementContent.length}).`);
            } else {
              console.log(`  -> WARNING: target content NOT found in current code!`);
            }
          } else if (call.name === 'multi_replace_file_content') {
            if (args.ReplacementChunks) {
              let allFound = true;
              for (const chunk of args.ReplacementChunks) {
                if (!currentCode.includes(chunk.TargetContent)) {
                  allFound = false;
                  console.log(`  -> WARNING: chunk target content NOT found in current code!`);
                }
              }
              if (allFound) {
                for (const chunk of args.ReplacementChunks) {
                  currentCode = currentCode.replace(chunk.TargetContent, chunk.ReplacementContent);
                }
                stepsApplied.push(`multi_replace_file_content (Step ${stepObj.step_index})`);
                console.log(`  -> Applied ${args.ReplacementChunks.length} chunks successfully.`);
              } else {
                console.log(`  -> WARNING: some chunks NOT found. Trying to apply individual matching chunks...`);
                let appliedCount = 0;
                for (const chunk of args.ReplacementChunks) {
                  if (currentCode.includes(chunk.TargetContent)) {
                    currentCode = currentCode.replace(chunk.TargetContent, chunk.ReplacementContent);
                    appliedCount++;
                  }
                }
                stepsApplied.push(`multi_replace_file_content_partial (Step ${stepObj.step_index}, ${appliedCount}/${args.ReplacementChunks.length})`);
                console.log(`  -> Applied ${appliedCount} of ${args.ReplacementChunks.length} chunks.`);
              }
            }
          }
        }
      }
    }
  } catch(e) {
    // line parsing error
  }
}

console.log("\nReconstruction summary:");
console.log("Steps applied:", stepsApplied);
console.log("Final reconstructed code length:", currentCode.length);

if (currentCode.length > 0) {
  const outputPath = 'c:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\reconstructed_diaspora_support.tsx';
  fs.writeFileSync(outputPath, currentCode, 'utf8');
  console.log("Saved reconstructed file to:", outputPath);
}
