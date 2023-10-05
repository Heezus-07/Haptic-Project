const http= require("node:http");
const { setupRouter } = require("./rotues.js");

const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => setupRouter(req, res));

server.listen(port, hostname, async () => {
	console.log(`Server listening at: http://${hostname}:${port}`);
});