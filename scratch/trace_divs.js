const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\bbrit\\OneDrive\\Área de Trabalho\\Bellatrix\\bellatrix-crm\\src\\components\\quotes\\QuoteForm.tsx', 'utf8');

const lines = content.split('\n');
let balance = 0;
lines.forEach((line, i) => {
  const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length; // Ignore self-closing divs
  const closes = (line.match(/<\/div>/g) || []).length;
  const oldBalance = balance;
  balance += (opens - closes);
  if (balance !== oldBalance) {
     if (i + 1 > 850) {
       console.log(`Line ${i+1}: ${line.trim().substring(0, 50)}... | Diff: ${opens - closes} | New Balance: ${balance}`);
     }
  }
});
