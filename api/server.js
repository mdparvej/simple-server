
const serverless = require('serverless-http');

const app = require('../index');
// Middleware


// Export both app & handler
module.exports = app;
module.exports.handler = serverless(app);
