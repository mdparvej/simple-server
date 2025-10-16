
const serverless = require('serverless-http');

const app = require('../index');

app.get('/parvej', (req, res) => {
  res.send('🎉 Hello from Serverless Express App!');
});
// Export both app & handler
module.exports = app;
module.exports.handler = serverless(app);

