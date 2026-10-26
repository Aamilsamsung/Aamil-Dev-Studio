const services = new Set(['Business website','Python automation','AI / API integration','Something else']);
const json = (res, code, body) => res.status(code).json(body);
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  const enabled = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM && process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY);
  if (req.method === 'GET') return json(res,200,{enabled,siteKey: enabled ? process.env.TURNSTILE_SITE_KEY : null});
  if (req.method !== 'POST') { res.setHeader('Allow','GET, POST'); return json(res,405,{error:'Method not allowed.'}); }
  if (!req.headers['content-type']?.startsWith('application/json')) return json(res,415,{error:'JSON required.'});
  const host = req.headers.host;
  if (!req.headers.origin || req.headers.origin !== `https://${host}` && !(process.env.NODE_ENV === 'test' && req.headers.origin === `http://${host}`)) return json(res,403,{error:'Invalid request origin.'});
  let data = req.body;
  try { if(typeof data === 'string') data = JSON.parse(data); } catch { return json(res,400,{error:'Invalid JSON.'}); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json(res,400,{error:'Invalid enquiry.'});
  if (Buffer.byteLength(JSON.stringify(data)) > 16000) return json(res,413,{error:'Enquiry is too large.'});
  if (data.website) return json(res,400,{error:'Invalid enquiry.'});
  for (const key of ['name','email','service','message','token']) if(typeof data[key] !== 'string') return json(res,400,{error:'Complete all required fields.'});
  const {name,email,service,message,token} = Object.fromEntries(Object.entries(data).map(([k,v])=>[k,typeof v === 'string' ? v.trim() : v]));
  if(!name || name.length > 100 || /[\r\n\x00]/.test(name) || email.length > 200 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !services.has(service) || message.length < 20 || message.length > 4000 || !token || token.length > 2048) return json(res,400,{error:'Check your name, email, service and project details (20–4000 characters).'});
  if (!enabled) return json(res,503,{error:'Online enquiries are not configured yet. Please email zevqlabs@gmail.com directly.'});
  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(8000)});
    const check = await verification.json();
    if (!verification.ok || !check.success || check.hostname !== host.split(':')[0]) return json(res,400,{error:'Spam verification failed. Please try again.'});
    const delivery = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.CONTACT_FROM,to:['zevqlabs@gmail.com'],reply_to:email,subject:`Studio enquiry: ${service}`,text:`Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}`}),signal:AbortSignal.timeout(10000)});
    if (!delivery.ok) { console.error('Contact provider rejected request',delivery.status); return json(res,502,{error:'Email service is unavailable. Please email directly.'}); }
    return json(res,200,{accepted:true});
  } catch { console.error('Contact provider timeout or network failure'); return json(res,502,{error:'Delivery could not be confirmed. Please email directly.'}); }
};
