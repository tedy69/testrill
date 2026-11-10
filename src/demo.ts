import { projectSchema } from './schema.js';

export const demoProject = (baseUrl: string) =>
  projectSchema.parse({
    version: 1,
    id: 'example-storefront',
    name: 'Example storefront',
    description:
      'A bundled test application. Run real checkout and streaming tests without another repository.',
    baseUrl,
    suites: [
      {
        id: 'checkout',
        name: 'Successful checkout',
        description: 'Submit an order and verify the confirmation screen.',
        defaultScenario: 'payment-success',
        steps: [
          { type: 'navigate', url: '?api={{mockUrl}}' },
          { type: 'fill', label: 'Email address', value: 'tester@example.test' },
          { type: 'click', name: 'Place order' },
          { type: 'expectText', text: 'Order confirmed' },
          { type: 'screenshot', name: 'order-confirmation' },
        ],
      },
      {
        id: 'declined',
        name: 'Declined payment recovery',
        description: 'Verify a rejected payment is explained and the form remains usable.',
        defaultScenario: 'payment-declined',
        steps: [
          { type: 'navigate', url: '?api={{mockUrl}}' },
          { type: 'fill', label: 'Email address', value: 'tester@example.test' },
          { type: 'click', name: 'Place order' },
          { type: 'expectText', text: 'Payment was declined. Try another card.' },
          { type: 'screenshot', name: 'payment-declined' },
        ],
      },
      {
        id: 'export',
        name: 'Export with a test checkpoint',
        description: 'Hold a stream at a known point, verify progress, then release completion.',
        defaultScenario: 'export-checkpoint',
        steps: [
          { type: 'navigate', url: '?api={{mockUrl}}' },
          { type: 'click', name: 'Start export' },
          { type: 'expectText', text: 'Export processing' },
          { type: 'screenshot', name: 'export-processing' },
          { type: 'checkpoint', name: 'finish-export' },
          { type: 'expectText', text: 'Export ready' },
        ],
      },
      {
        id: 'api',
        name: 'Checkout API contract',
        description: 'Assert status and body without opening a browser.',
        defaultScenario: 'payment-success',
        steps: [
          {
            type: 'request',
            method: 'POST',
            url: '{{mockUrl}}/checkout',
            body: { item: 'field-notebook' },
            expectStatus: 200,
            expectBodyIncludes: 'confirmed',
          },
        ],
      },
    ],
    scenarios: [
      {
        id: 'payment-success',
        name: 'Payment accepted',
        description: 'A short processing delay followed by confirmation.',
        routes: [
          {
            method: 'POST',
            path: '/checkout',
            delayMs: 300,
            body: { status: 'confirmed', orderId: 'sample-order' },
          },
        ],
      },
      {
        id: 'payment-declined',
        name: 'Payment declined',
        description: 'The API rejects the payment with a recoverable error.',
        routes: [
          {
            method: 'POST',
            path: '/checkout',
            status: 402,
            delayMs: 250,
            body: { error: 'Payment was declined. Try another card.' },
          },
        ],
      },
      {
        id: 'export-checkpoint',
        name: 'Checkpoint-controlled export',
        description: 'The stream waits for finish-export before sending completion.',
        routes: [
          {
            method: 'GET',
            path: '/events',
            stream: [
              { type: 'event', id: '1', data: '{"status":"processing"}' },
              { type: 'checkpoint', name: 'finish-export' },
              { type: 'delay', ms: 200 },
              { type: 'event', id: '2', data: '{"status":"complete"}' },
            ],
          },
        ],
      },
      {
        id: 'stream-interrupted',
        name: 'Interrupted export',
        description: 'Drop the connection after progress to exercise reconnection behavior.',
        routes: [
          {
            method: 'GET',
            path: '/events',
            stream: [
              { type: 'event', id: '1', data: '{"status":"processing"}' },
              { type: 'delay', ms: 800 },
              { type: 'disconnect' },
            ],
          },
        ],
      },
    ],
  });

export const demoHtml = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Field Supply | Testrill example</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f4f2eb;color:#202c29;font:16px/1.6 system-ui,sans-serif}main{max-width:780px;margin:64px auto;padding:32px}header{border-bottom:1px solid #d8dbd2;margin-bottom:32px;padding-bottom:20px}h1{font-size:28px}h2{font-size:21px}section{background:#fff;padding:28px;border:1px solid #d8dbd2;margin:24px 0;border-radius:8px}label{display:block;font-weight:600}input{display:block;padding:12px;width:100%;border:1px solid #667870;border-radius:4px;font:inherit;margin:8px 0 20px}button{background:#1c6556;color:white;border:0;border-radius:4px;padding:12px 20px;font:600 15px system-ui;cursor:pointer;min-height:44px}button:disabled{opacity:.6;cursor:not-allowed}button:focus-visible,input:focus-visible{outline:3px solid #ae5c22;outline-offset:3px}p{margin:10px 0}.meta{color:#52615a}footer{font-size:13px;color:#52615a}</style></head>
<body><main><header><p class="meta">TESTRILL EXAMPLE APPLICATION</p><h1>Field Supply</h1><p>A small storefront for testing meaningful failure states.</p></header>
<section><h2>Field notebook</h2><p>One notebook, ready for your next idea.</p><form id="checkout"><label for="email">Email address</label><input id="email" type="email" required autocomplete="off"><button id="order">Place order</button></form><p id="result" role="status" aria-live="polite"></p></section>
<section><h2>Order export</h2><p class="meta">Generate an export and watch its progress.</p><button id="export">Start export</button><p id="progress" role="status" aria-live="polite">No export running</p></section>
<footer>Bundled example. Orders and exports are simulated by your selected scenario.</footer></main>
<script>
const api = new URLSearchParams(location.search).get('api');
document.querySelector('#checkout').addEventListener('submit', async e => {
 e.preventDefault(); const button=document.querySelector('#order'); button.disabled=true;
 const result=document.querySelector('#result'); result.textContent='Processing order';
 try { if(!api) throw new Error('Select a mock scenario to test checkout.');
 const response=await fetch(api+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.querySelector('#email').value})});
 const body=await response.json(); result.textContent=response.ok?'Order confirmed':body.error||'Unable to place order';
 } catch(error){result.textContent=error.message} finally {button.disabled=false}
});
let source;
document.querySelector('#export').addEventListener('click', () => {
 const progress=document.querySelector('#progress');
 if(!api){progress.textContent='Select a stream scenario to test export.';return}
 if(source) source.close(); progress.textContent='Connecting'; source=new EventSource(api+'/events');
 source.onmessage=event=>{try{const data=JSON.parse(event.data);progress.textContent=data.status==='complete'?'Export ready':'Export processing';if(data.status==='complete')source.close()}catch{progress.textContent='Invalid export event'}};
 source.onerror=()=>{progress.textContent='Connection interrupted. Reconnecting...'};
});
</script></body></html>`;
