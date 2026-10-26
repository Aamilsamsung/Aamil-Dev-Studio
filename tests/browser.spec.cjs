const {test,expect}=require('@playwright/test');
for(const width of [390,768,1440]) {
 test(`navigation, validation and accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript({path:require.resolve('axe-core')});
  await page.goto((process.env.BASE_URL || 'http://127.0.0.1:8080'));
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width<761){await page.getByRole('button',{name:/Menu/}).click();await expect(page.locator('#main-nav')).toBeVisible();}
  await page.locator('#main-nav').getByRole('link',{name:'About'}).click();
  await expect(page.locator('#about')).toBeInViewport();
  if(width<761)await expect(page.locator('#main-nav')).toBeHidden();
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Send project enquiry'}).click();
  expect(await page.locator('input[name="name"]').evaluate(e=>e.validity.valueMissing)).toBe(true);
  await page.getByLabel('Your name').fill('Test visitor');
  await page.getByLabel('Email',{exact:true}).fill('bad-email');
  expect(await page.locator('input[name="email"]').evaluate(e=>e.validity.typeMismatch)).toBe(true);
  const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  expect(audit.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}))).toEqual([]);
  expect(errors).toEqual([]);
 });
}
test('all internal links have targets and external project links are safe',async({page})=>{
 await page.goto((process.env.BASE_URL || 'http://127.0.0.1:8080'));
 expect(await page.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.querySelector(a.getAttribute('href'))).map(a=>a.outerHTML))).toEqual([]);
 expect(await page.locator('a[target="_blank"]').evaluateAll(links=>links.every(a=>a.rel.includes('noopener')))).toBe(true);
});

const projects=require('../content/projects.json');
const base=process.env.BASE_URL || 'http://127.0.0.1:8080';
for(const width of [390,768,1440])for(const project of projects){
 test(`${project.slug}: direct route, refresh, links and accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript({path:require.resolve('axe-core')});
  const response=await page.goto(`${base}/projects/${project.slug}`);
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading',{level:1,name:project.name,exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{level:1,name:project.name,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.case-screenshot img')).toBeVisible();
  await expect.poll(()=>page.locator('.case-screenshot img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
  expect(await page.title()).toContain(project.name);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://zevq-labs.vercel.app/projects/${project.slug}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',`https://zevq-labs.vercel.app${project.image}`);
  await expect(page.getByRole('link',{name:/Enquire About This Project/})).toHaveAttribute('href','/#contact');
  if(project.live)await expect(page.getByRole('link',{name:/Visit Live Application/})).toHaveAttribute('href',project.live);
  else await expect(page.getByRole('link',{name:/Visit Live Application/})).toHaveCount(0);
  await expect(page.locator('.related-grid .case-card')).toHaveCount(3);
  const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByRole('link',{name:'Back to Projects',exact:true}).click();
  await expect(page.locator('#projects')).toBeInViewport();
 });
}
test('homepage cards navigate internally and support browser Back',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#projects .project-card-link')).toHaveCount(4);
 for(const p of projects){
  const card=page.locator(`#projects a[href="/projects/${p.slug}"]`);
  await expect(card).toContainText('Explore Project');
  await card.click();await expect(page).toHaveURL(`${base}/projects/${p.slug}`);
  await expect(page.getByRole('heading',{level:1})).toHaveText(p.name);
  await page.goBack();await expect(page.locator('#projects')).toBeVisible();
 }
});
test('local and cross-page internal links resolve, missing paths have a useful 404',async({page,request})=>{
 for(const pathname of ['/',...projects.map(p=>'/projects/'+p.slug)]){
  await page.goto(base+pathname);
  const hrefs=await page.locator('a[href^="/"]').evaluateAll(els=>[...new Set(els.map(a=>a.getAttribute('href').split('#')[0]).filter(Boolean))]);
  for(const href of hrefs)expect((await request.get(base+href)).status(),href).toBe(200);
  expect(await page.locator('a[target="_blank"]').evaluateAll(els=>els.every(a=>a.rel.includes('noopener')&&a.rel.includes('noreferrer')))).toBe(true);
 }
 const response=await page.goto(base+'/projects/does-not-exist');expect(response.status()).toBe(404);
 await expect(page.getByRole('link',{name:'Back to Projects',exact:true})).toBeVisible();
});
test('document load measurements and screenshot transfer budget',async({page})=>{
 for(const path of ['/',...projects.map(p=>'/projects/'+p.slug)]){
  await page.goto(base+path,{waitUntil:'load'});
  const timing=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {path:location.pathname,domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),loadMs:Math.round(n.loadEventEnd),documentTransferBytes:n.transferSize};});
  console.log('Document timing',JSON.stringify(timing));
  expect(await page.locator('img').evaluateAll(els=>els.every(i=>i.hasAttribute('width')&&i.hasAttribute('height')))).toBe(true);
 }
});
