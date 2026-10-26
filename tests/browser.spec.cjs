const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
for(const width of [390,768,1440]) {
 test(`navigation, validation and accessibility at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080');
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
  await page.addScriptTag({content:fs.readFileSync(require.resolve('axe-core'),'utf8')});
  const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  expect(audit.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}))).toEqual([]);
  expect(errors).toEqual([]);
 });
}
test('all internal links have targets and external project links are safe',async({page})=>{
 await page.goto('http://127.0.0.1:8080');
 expect(await page.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.querySelector(a.getAttribute('href'))).map(a=>a.outerHTML))).toEqual([]);
 expect(await page.locator('a[target="_blank"]').evaluateAll(links=>links.every(a=>a.rel.includes('noopener')))).toBe(true);
});
