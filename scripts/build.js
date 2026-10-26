const fs = require('node:fs');
fs.rmSync('dist',{recursive:true,force:true}); fs.mkdirSync('dist');
for(const file of ['index.html','styles.css','script.js','favicon.svg','social-card.png','robots.txt']) fs.copyFileSync(file,`dist/${file}`);
console.log('Built static assets to dist; Vercel builds api/contact.js separately.');
