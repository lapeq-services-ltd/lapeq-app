const fs = require('fs');
const path = require('path');

const otherConvoId = 'c63074bb-5dd2-40f6-affe-cb9a1c413a2f';
const logPath = `C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\${otherConvoId}\\.system_generated\\logs\\transcript.jsonl`;

if (!fs.existsSync(logPath)) {
  console.error("Other convo log file does not exist at: " + logPath);
  process.exit(1);
}

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

console.log(`Scanning other conversation's ${lines.length} log lines...`);

let viewFileCount = 0;
let codeActionCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;

  try {
    const data = JSON.parse(line);
    
    // Check if VIEW_FILE returned diaspora-support.tsx content
    if (data.type === 'VIEW_FILE' && data.status === 'DONE' && data.content && data.content.includes('diaspora-support.tsx') && data.content.includes('export default function DiasporaScreen')) {
      const output = data.content;
      console.log(`Line ${i + 1}: Found VIEW_FILE output in other convo! Step ${data.step_index}. Length: ${output.length}`);
      
      const linesOfCode = [];
      const rawLines = output.split('\n');
      for (const rawLine of rawLines) {
        const match = rawLine.match(/^\s*\d+:\s(.*)$/);
        if (match) {
          linesOfCode.push(match[1]);
        }
      }
      
      if (linesOfCode.length > 0) {
        const fullCode = linesOfCode.join('\n');
        const recoveryPath = `C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\full_recovered_other_${data.step_index}.tsx`;
        fs.writeFileSync(recoveryPath, fullCode, 'utf8');
        console.log(`  Saved full code to ${recoveryPath}`);
        viewFileCount++;
      }
    }

    // Check if MODEL called write_to_file or replace_file_content with diaspora-support.tsx
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        let args = call.args;
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch(e) {}
        }
        const target = args.TargetFile || args.Target;
        if (target && target.toLowerCase().includes('diaspora-support.tsx')) {
          console.log(`Line ${i + 1}: Step ${data.step_index} tool call: ${call.name}`);
          
          if (args.CodeContent) {
            const recoveryPath = `C:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\code_recovered_other_${data.step_index}.tsx`;
            fs.writeFileSync(recoveryPath, args.CodeContent, 'utf8');
            console.log(`  Saved write_to_file code to ${recoveryPath}`);
            codeActionCount++;
          }
        }
      }
    }
  } catch(e) {}
}

console.log(`Done. Recovered ${viewFileCount} from VIEW_FILE and ${codeActionCount} from code actions.`);
