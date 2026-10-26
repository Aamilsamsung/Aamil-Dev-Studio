const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/contact');
const originalFetch=global.fetch;
const keys=['RESEND_API_KEY','CONTACT_FROM','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY'];
afterEach(()=>{global.fetch=originalFetch;for(const k of keys)delete process.env[k];});
const valid={name:'Test visitor',email:'test@example.com',service:'Business website',message:'Please build a website for my studio.',token:'test-token',website:''};
async function call(body=valid,extra={}){let code,data;const headers={};const res={setHeader:(k,v)=>headers[k]=v,status:n=>{code=n;return res;},json:x=>{data=x;}};await handler({method:'POST',headers:{host:'studio.example',origin:'https://studio.example','content-type':'application/json'},body,...extra},res);return {code,data,headers};}
function configure(){for(const k of keys)process.env[k]='test-only';}
test('configuration exposes no secrets and disables unconfigured delivery',async()=>{const r=await call(null,{method:'GET'});assert.deepEqual(r.data,{enabled:false,siteKey:null});});
test('unconfigured delivery fails honestly',async()=>assert.equal((await call()).code,503));
test('rejects unsupported method',async()=>assert.equal((await call(null,{method:'DELETE'})).code,405));
test('rejects foreign origin',async()=>assert.equal((await call(valid,{headers:{origin:'https://evil.example',host:'studio.example','content-type':'application/json'}})).code,403));
test('rejects non-JSON',async()=>assert.equal((await call(valid,{headers:{'content-type':'text/plain'}})).code,415));
test('rejects malformed JSON',async()=>assert.equal((await call('{')).code,400));
test('rejects oversized input',async()=>assert.equal((await call({...valid,message:'x'.repeat(17000)})).code,413));
test('rejects honeypot',async()=>assert.equal((await call({...valid,website:'spam'})).code,400));
test('rejects invalid fields',async()=>{for(const patch of [{name:'\n'},{email:'bad'},{service:'arbitrary'},{message:'short'},{token:''},{name:'x'.repeat(101)},{email:'a\r\nb@example.com'}])assert.equal((await call({...valid,...patch})).code,400);});
test('rejects failed challenge without sending',async()=>{configure();let calls=0;global.fetch=async()=>{calls++;return {ok:true,json:async()=>({success:false})};};assert.equal((await call()).code,400);assert.equal(calls,1);});
test('rejects challenge from another hostname',async()=>{configure();global.fetch=async()=>({ok:true,json:async()=>({success:true,hostname:'evil.example'})});assert.equal((await call()).code,400);});
test('sends only to studio and uses visitor as reply-to',async()=>{configure();let count=0;global.fetch=async(url,opts)=>{count++;if(count===1)return {ok:true,json:async()=>({success:true,hostname:'studio.example'})};const payload=JSON.parse(opts.body);assert.deepEqual(payload.to,['zevqlabs@gmail.com']);assert.equal(payload.reply_to,valid.email);assert.ok(payload.text.includes(valid.message));return {ok:true};};assert.equal((await call()).code,200);assert.equal(count,2);});
test('provider rejection never reports success',async()=>{configure();let count=0;global.fetch=async()=>++count===1?{ok:true,json:async()=>({success:true,hostname:'studio.example'})}:{ok:false,status:429};assert.equal((await call()).code,502);});
test('network failure never reports success',async()=>{configure();global.fetch=async()=>{throw new Error('test timeout');};assert.equal((await call()).code,502);});
