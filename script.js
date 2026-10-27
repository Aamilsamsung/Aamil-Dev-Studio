'use strict';
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
document.querySelector('#year').textContent = new Date().getFullYear();
menu.hidden = false;
const narrow = matchMedia('(max-width: 760px)');
function syncMenu() { nav.hidden = narrow.matches; menu.setAttribute('aria-expanded', String(!nav.hidden)); }
syncMenu(); narrow.addEventListener('change', syncMenu);
menu.addEventListener('click', () => { nav.hidden = !nav.hidden; menu.setAttribute('aria-expanded', String(!nav.hidden)); });
nav.addEventListener('click', e => { if (e.target.closest('a') && narrow.matches) syncMenu(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && narrow.matches && !nav.hidden) { syncMenu(); menu.focus(); } });
if (form && status) {
let widget;
let contactReady = false;
const submit = form.querySelector('button[type="submit"]');
async function configureContact() {
  try {
    const response = await fetch('/api/contact');
    if (!response.ok) throw new Error();
    const config = await response.json();
    if (!config.siteKey || !config.enabled) throw new Error();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      try { widget = window.turnstile.render('#spam-check', { sitekey: config.siteKey, theme: 'dark' }); contactReady = true; submit.textContent = 'Send project enquiry ↗'; document.querySelector('#contact-privacy').textContent = 'Your details are used to respond to your enquiry and sent using an email service. Please do not include passwords or sensitive information.'; status.textContent = 'Complete spam verification to send your enquiry.'; }
      catch { status.textContent = 'Spam protection is unavailable. Continue to Gmail to send your enquiry.'; }
    };
    script.onerror = () => { status.textContent = 'Spam protection is unavailable. Continue to Gmail to send your enquiry.'; };
    document.head.append(script);
  } catch { status.textContent = 'Continue to Gmail to review and send your enquiry.'; }
}
configureContact();
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  for (const key of ['name','email','message']) data[key] = data[key].trim();
  if (!data.name || data.message.length < 20) { status.textContent = 'Enter your name and at least 20 characters of project details.'; return; }
  if (data.website) { status.textContent = 'Unable to prepare this enquiry.'; return; }
  if (!contactReady) {
    const params = new URLSearchParams({view:'cm', fs:'1', to:'zevqlabs@gmail.com', su:'ZEVQ Labs project enquiry: ' + data.service, body:`Name: ${data.name}\nEmail: ${data.email}\nService: ${data.service}\n\nProject details:\n${data.message}`});
    status.textContent = 'Opening Gmail. Review your draft and press Send.';
    window.location.assign('https://mail.google.com/mail/?' + params.toString());
    return;
  }
  data.token = window.turnstile?.getResponse(widget) || '';
  if (!data.token) { status.textContent = 'Please complete spam verification. If it is unavailable, email directly below.'; return; }
  submit.disabled = true; status.textContent = 'Sending your enquiry…';
  try {
    const response = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Sending failed. Please email directly below.');
    status.textContent = 'Your enquiry was accepted by the email service. Thank you; I’ll reply by email.';
    form.reset();
  } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'Delivery status is uncertain. Please email directly if you do not hear back.' : error.message; }
  finally { submit.disabled = false; if(window.turnstile && widget !== undefined) window.turnstile.reset(widget); }
});

}

// Reflect the current section without intercepting native anchor navigation.
const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
if ('IntersectionObserver' in window) {
 const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
   for (const link of sectionLinks) link.classList.toggle('active', link.hash === '#' + entry.target.id);
  }
 }, {rootMargin:'-10% 0px -65% 0px'});
 for (const link of sectionLinks) {const target=document.querySelector(link.hash);if(target)observer.observe(target);}
}

// Keep screenshot failures understandable without substituting invented imagery.
for (const image of document.querySelectorAll('.project-image img, .case-screenshot img')) {
 const unavailable = () => {
  if (image.hidden) return;
  image.hidden = true;
  const message = document.createElement('p');
  message.className = 'screenshot-unavailable';
  message.textContent = 'Screenshot temporarily unavailable. Project details and source links remain available.';
  image.parentElement.append(message);
 };
 image.addEventListener('error', unavailable, {once:true});
 if(image.complete && !image.naturalWidth) unavailable();
}
