const https = require('https');

const apiKey = process.env.ANTHROPIC_API_KEY;
console.log('API Key available:', apiKey ? 'YES' : 'NO');

if (apiKey) {
  const postData = JSON.stringify({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: 'Say hello briefly',
      },
    ],
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  };

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Response received, text:', response.content?.[0]?.text?.substring(0, 50));
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });

  req.on('error', (err) => {
    console.log('Request error:', err.message);
  });

  req.write(postData);
  req.end();
} else {
  console.log('No API key');
}
