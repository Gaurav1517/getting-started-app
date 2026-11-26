const express = require('express');
const app = express();
const { version: packageVersion } = require('../package.json');
const db = require('./persistence');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

app.use(express.json());

// Blue-green lab: health check target for the ALB + environment info for the UI banner
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/version', (req, res) => res.json({
    color: process.env.APP_COLOR || 'local',
    // AWS sets APP_VERSION to the deployed git tag; otherwise report the code's own version.
    version: process.env.APP_VERSION || `v${packageVersion}`,
    host: require('os').hostname(),
}));

app.use(express.static(__dirname + '/static'));

app.get('/items', getItems);
app.post('/items', addItem);
app.put('/items/:id', updateItem);
app.delete('/items/:id', deleteItem);

db.init().then(() => {
    app.listen(3000, () => console.log('Listening on port 3000'));
}).catch((err) => {
    console.error(err);
    process.exit(1);
});

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
