const url = require("node:url");
const {
	uploadImage,
	uploadTexture,
	patchImage,
	patchTexture,
	getImages,
	getTextures,
	getTexturesList,
	downloadFile,
	generateImage,
	getHistory
} = require("./controllers");
const {
	redirect,
	sendHTMLFile,
	sendJavascriptFile,
	sendNotFoundError,
	send404Page
} = require("./utils");

function setupRouter(req, res) {
	const path = url.parse(req.url).pathname;

	console.log({ path });

	switch (true) {
		case path.startsWith("/admin"): {
			switch (true) {
				case path === "/admin/index.html":
					return sendHTMLFile(res, `/..${path}`);
				case path === "/admin/htmx.min.js":
					return sendJavascriptFile(res, `/..${path}`);
				case path.startsWith("/"):
					return redirect(res, "/admin/index.html");
				default: send404Page(res);
			}

			break;
		}
		case path.startsWith("/client"): {
			switch (true) {
				case path === "/client/index.html":
					return sendHTMLFile(res, `/..${path}`);
				case path === "/client/htmx.min.js":
					return sendJavascriptFile(res, `/..${path}`);
				case path.startsWith("/"):
					return redirect(res, "/client/index.html");
				default: send404Page(res);
			}

			break;
		}
		case path.startsWith("/upload"): {
			switch (true) {
				case path === "/upload/image":
					return uploadImage(req, res);
				case path === "/upload/texture":
					return uploadTexture(req, res);
			}

			break;
		}
		case path.startsWith("/patch"): {
			switch (true) {
				case path.startsWith("/patch/image"):
					return patchImage(req, res);
				case path.startsWith("/patch/texture"):
					return patchTexture(req, res);
			}

			break;
		}
		case path.startsWith("/history"):
			return getHistory(req, res);
		case path.startsWith("/images"):
			return getImages(req, res);
		case path.startsWith("/textures/list"):
			return getTexturesList(req, res);
		case path.startsWith("/textures"):
			return getTextures(req, res);
		case path.startsWith("/download"):
			return downloadFile(req, res);
		case path.startsWith("/generate/image"):
			return generateImage(req, res);
		case path.startsWith("/"):
			return redirect(res, "/client/index.html");
	}

	sendNotFoundError(res, `Could not find ${path}`);
}

module.exports = { setupRouter };