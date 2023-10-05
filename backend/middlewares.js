const { getBoundary, structureParsedMultipartData, parse } = require("./multipart");

function upload(req, res, callback) {
	let body = [];

	req.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		body = Buffer.concat(body);

		const boundary = getBoundary(req.headers['content-type']);

		if (boundary) {
			req.body = structureParsedMultipartData(parse(body, boundary));
			callback(req, res);
		} else {
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			res.end('Bad Request: Boundary not found');
		}
	});
}

function parseFormData(req, res, callback) {
	let body = '';

	req.on('data', chunk => {
		body += chunk.toString();
	}).on('end', () => {
		const formData = {};

		body.split("&").forEach(pair => {
			const [key, value] = pair.split('=');

			const decodedKey = decodeURIComponent(key);
			const decodedValue = decodeURIComponent(value);

			if (Array.isArray(formData[decodedKey]))
				formData[decodedKey].push(decodedValue);
			else if (formData[decodedKey])
				formData[decodedKey] = [formData[decodedKey], decodedValue]
			else formData[decodedKey] = decodedValue;
		});

		req.body = formData;

		callback(req, res);
	});
}

module.exports = { upload, parseFormData };
