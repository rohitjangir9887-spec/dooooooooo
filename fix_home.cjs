const fs = require('fs');

let homeCode = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// I will just use regex to clean up the bad insertion and then re-insert properly
const badSnippet = `        </div>\n      </div>\n      \n      xl z-10 flex flex-col items-center"`;
const goodSnippet = `      className="w-full max-w-4xl z-10 flex flex-col items-center"`;

// Wait, the bad part starts around the grid
const match = homeCode.match(/<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">[\s\S]*?<\/div>\s*<\/div>\s*xl z-10 flex flex-col items-center"\s*>\s*<div/);

if (match) {
  // It's messed up. Let's just restore the motion.div opening
  homeCode = homeCode.replace(match[0], `      className="w-full max-w-4xl z-10 flex flex-col items-center"\n      >\n        <div className="w-full mb-8">\n          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">\n${match[0].substring(match[0].indexOf('<div className="md:col-span-1'), match[0].lastIndexOf('</div>      </div>'))}</div></div>\n        <div`);
} else {
  console.log("Not found");
}

fs.writeFileSync('src/pages/Home.tsx', homeCode);
