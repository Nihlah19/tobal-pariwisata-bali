// Tour Penjelajah Bali API Status & Healthcheck
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.status(200).json({
    status: 'ok',
    message: 'Tour Penjelajah Bali API ready',
    version: '1.0.0',
    endpoints: [
      '/api/recommend',
      '/api/identify-culture'
    ]
  });
}
