const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\PAP AMNESTY\\.gemini\\antigravity-ide\\brain\\6795a66a-f3d9-434d-b4a8-180fff88dba1\\scratch\\rep_1419.json';
if (fs.existsSync(filePath)) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log("Description:", data.Description);
  console.log("StartLine:", data.StartLine, "EndLine:", data.EndLine);
  console.log("ReplacementContent length:", data.ReplacementContent.length);
  
  // Write the replacement content to a clean text file in the workspace scratch
  const destPath = 'c:\\Users\\PAP AMNESTY\\Documents\\lapeq-app\\scratch\\rep_1419_extracted.txt';
  fs.writeFileSync(destPath, data.ReplacementContent, 'utf8');
  console.log("Extracted ReplacementContent saved to:", destPath);
} else {
  console.log("rep_1419.json not found.");
}
