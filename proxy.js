const cors_proxy = require('cors-anywhere');

const host = 'localhost';
const port = 8080;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
}).listen(port, host, () => {
    console.log(`CORS Proxy running at http://${host}:${port}/`);
});