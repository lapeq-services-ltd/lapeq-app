const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.error("Log file does not exist at:", logPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

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
        
        const contentStr = JSON.stringify(args).toLowerCase();
        if (contentStr.includes('diaspora-support.tsx') || contentStr.includes('diaspora-support')) {
          console.log(`Step ${stepObj.step_index} (${stepObj.created_at}) - Tool: ${call.name}`);
          console.log(`  TargetFile: ${args.TargetFile || args.Target || args.AbsolutePath}`);
          if (args.CodeContent) {
            console.log(`  Has CodeContent (len: ${args.CodeContent.length})`);
          }
          if (args.ReplacementContent) {
            console.log(`  Has ReplacementContent (len: ${args.ReplacementContent.length})`);
          }
          if (args.ReplacementChunks) {
            console.log(`  Has ReplacementChunks: ${args.ReplacementChunks.length} chunks`);
          }
        }
      }
    }
  } catch(e) {}
}
