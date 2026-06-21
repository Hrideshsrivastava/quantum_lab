const fs = require('fs');

const path = '/home/hridesh/Documents/coding_linux/webdev/quantum/quantum_lab/login.html';
let content = fs.readFileSync(path, 'utf-8');

const lines = content.split('\n');
const newLines = [];

let inConflict = false;
let keepLine = true;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('<<<<<<< HEAD')) {
    inConflict = true;
    keepLine = true; // Keep HEAD
    continue;
  }
  if (line.startsWith('=======')) {
    keepLine = false; // Ignore the other branch
    continue;
  }
  if (line.startsWith('>>>>>>>')) {
    inConflict = false;
    keepLine = true;
    continue;
  }
  
  if (!inConflict || keepLine) {
    newLines.push(line);
  }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Fixed conflicts in login.html');
