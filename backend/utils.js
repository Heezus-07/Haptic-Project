const util = require("node:util");
const fs = require("node:fs");

const readFile = util.promisify(fs.readFile);

async function execPromise(promise) {
	try {
		return [null, await promise()];
	} catch (e) {
		return [e, null];
	}
}

function prep(res, { status, headers, data, config }) {
	if (!status) status = 200;
	if (!headers) headers = {};

	if (config && config['internalHeaders']?.length)
		Object
			.entries(config['internalHeaders'])
			.map(v => headers[v[0]] = v[1]);

	res.writeHead(status, headers);
	if (data) res.write(data);
}

function send(res, { status, headers, data, config }) {
	prep(res, { status, headers, data, config });
	res.end();
}

function sendError(res, { message, status, headers }) {
	send(res, { status: status ?? 500, headers, message });
}

function sendRequestError(res, message, headers) {
	sendError(res, { message, status: 400, headers });
}

function sendNotFoundError(res, message, headers) {
	sendError(res, { message, status: 404, headers });
}

function sendServerError(res, message, headers) {
	sendError(res, { message, status: 500, headers });
}

function send404Page(res) {
	sendHtml(res, "<p>This is not the page you are looking for.</p>" );
}

function sendPlain(res, data, config) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data,
		config: {
			...(config ? config : {}),
			internalHeaders: {"Content-Type": "text/plain"},
		}
	});
}

function sendJson(res, data, config) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data: JSON.stringify(data),
		config: {
			...(config? config: {}),
			internalHeaders: {"Content-Type": "application/json" }
		}
	});
}

function sendHtml(res, data, config) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data,
		config: {
			...(config? config: {}),
			internalHeaders: {"Content-Type": "text/html" }
		}
	});
}

function sendJavascript(res, data, config) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data,
		config: {
			...(config? config: {}),
			internalHeaders: {"Content-Type": "application/javascript" }
		}
	});
}

function sendCSS(res, data, config) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data,
		config: {
			...(config? config: {}),
			internalHeaders: {"Content-Type": "text/css" }
		}
	});
}

function sendAAC(res, data, config = {}) {
	send(res, {
		status: config?.status,
		headers: config?.headers,
		data,
		config: {
			...(config? config: {}),
			internalHeaders: {"Content-Type": "audio/aac" }
		}
	});
}

async function sendHTMLFile(res, path) {
	const [err, data] = await execPromise( () => readFile(__dirname + path));

	if (err) {
		console.error(err);
		return sendNotFoundError(res, path);
	}

	sendHtml(res, data);
}

async function sendJavascriptFile(res, path) {
	const [err, data] =await execPromise(() => readFile(__dirname + path));

	if (err) {
		console.error(err);
		return sendNotFoundError(res, path);
	}

	sendJavascript(res, data);
}

function sendFileAsAttachment(res, file, encoding = 'base64') {
	send(
		res,
		{
			status: 200,
			headers: {
				'Content-Type': file.mime,
				'Content-Disposition': 'attachment; filename=' + file.name
			},
			data: Buffer.from(file.blob, encoding),
		}
	);
}

function redirect(res, to) {
	send(res, { status: 302, headers: { "Location": to } });
}

module.exports = {
	prep,
	send,
	sendError,
	sendRequestError,
	sendNotFoundError,
	sendServerError,
	send404Page,
	sendPlain,
	sendJson,
	sendHtml,
	sendJavascript,
	sendCSS,
	sendAAC,
	sendHTMLFile,
	sendJavascriptFile,
	sendFileAsAttachment,
	redirect,
	readFile,
	execPromise
}