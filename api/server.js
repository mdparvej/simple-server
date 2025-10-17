
const serverless = require('serverless-http');

const app = require('../index');
const router = require('express').Router;

router.get('/ping', (req, res) => {
    res.json({ ok: true, msg: 'pong' });
});

router.get('/hello/:name?', (req, res) => {
    const name = req.params.name || 'world';
    res.json({ hello: name });
});
app.use('/api', router);

// Export both app & handler
module.exports = app;
module.exports.handler = serverless(app);

