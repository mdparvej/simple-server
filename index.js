const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('🎉 Hello from Serverless Express App!');
});

app.get('/api/user/:name', (req, res) => {
  const { name } = req.params;
  res.json({ message: `Welcome, ${name}! 👋` });
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  res.json({ received: data, status: 'success ✅' });
});

// Export both app & handler
module.exports = app;
