import fetch from 'node-fetch';
async function run() {
  const res = await fetch('http://localhost:3000/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: '9abccdea-2091-4f35-bd31-822028c634ce' }) // replace with real ID if needed, wait, I'll pass a dummy userId too since requireAuth is skipped
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
