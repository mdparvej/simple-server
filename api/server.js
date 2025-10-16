
const serverless = require('serverless-http');

const app = require('../index');


// Export both app & handler
module.exports = app;
module.exports.handler = serverless(app);

