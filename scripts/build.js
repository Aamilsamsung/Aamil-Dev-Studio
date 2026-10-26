const fs=require('node:fs');
const {card,page,escape}=require('./project-template');
const projects=require('../content/projects.json');
const origin='https://zevq-labs.vercel.app';
const source=fs.readFileSync('index.html','utf8');
if(!source.includes('<!-- PROJECT_CARDS -->'))throw new Error('Homepage card template marker is missing');
const header=source.match(/<header[\s\S]*?<\/header>/)[0].replace(/href="#/g,'href="/#').replace('class="active"','');
const projectHeader=header.replace('href="/#projects"','href="/#projects" aria-current="page"');
const footer=source.match(/<footer[\s\S]*?<\/footer>/)[0];
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/projects',{recursive:true});
fs.writeFileSync('dist/index.html',source.replace('<!-- PROJECT_CARDS -->',projects.map(p=>card(p)).join('')));
for(const file of ['styles.css','script.js','favicon.svg','social-card.png','robots.txt'])fs.copyFileSync(file,`dist/${file}`);
fs.cpSync('assets','dist/assets',{recursive:true,filter:source=>!source.endsWith('.md')});
for(const project of projects){if(!fs.existsSync('.'+project.image))throw new Error(`Missing screenshot: ${project.image}`);fs.writeFileSync(`dist/projects/${project.slug}.html`,page(project,projects,projectHeader,footer));}
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...projects.map(p=>'/projects/'+p.slug)].map(path=>`<url><loc>${origin}${escape(path)}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync('dist/404.html',`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | ZEVQ Labs</title><link rel="stylesheet" href="/styles.css"></head><body class="project-page"><main class="container case-hero"><p class="eyebrow">404 / PAGE NOT FOUND</p><h1>This page isn’t here.</h1><p>The address may have changed. Explore the portfolio or send a project brief.</p><a class="button primary" href="/#projects">Back to Projects</a></main></body></html>`);
console.log(`Built homepage, ${projects.length} static detail pages, sitemap and 404. Vercel packages api/contact.js separately.`);
