import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:3000/api/payment/create-order', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock'
    },
    body: JSON.stringify({ planId: 'mock' })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run();
