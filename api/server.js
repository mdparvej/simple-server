
const serverless = require('serverless-http');

const app = require('../index');

app.get('/phone', (req, res) => {
  res.send('🎉 Hello from Serverless Express phone App!');
});
// Export both app & handler
module.exports = app;
module.exports.handler = serverless(app);

