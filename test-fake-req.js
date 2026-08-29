import fetch from 'node-fetch';

async function run() {
  const token = 'fake-token-but-maybe-not-auth-route';
  const res = await fetch('http://localhost:3000/api/payment/create-order', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ planId: 'dummy' })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
