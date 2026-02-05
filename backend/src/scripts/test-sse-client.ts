
import http from 'http';

console.log('🎧 Connecting to Event Stream...');

const req = http.request('http://localhost:3000/api/alerts/stream', (res) => {
  console.log(`✅ Connected! Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    const msg = chunk.toString();
    // Filter out keep-alive newlines
    if (msg.trim()) {
      console.log('📩 RECEIVED DATA:');
      console.log(msg);
    }
  });
  
  res.on('end', () => {
    console.log('❌ Stream ended');
  });
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.end();
