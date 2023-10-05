const url = require("node:url");
const db = require("./data/db.js");
const { upload, parseFormData} = require("./middlewares");
const {
	imageListItem,
	textureListItem,
	paragraph,
	inputLegend,
	textureSelectorItem,
	textureSelectorRetryFetching,
	generatedImage, historyItem
} = require("./templates");
const {
	sendHtml,
	sendNotFoundError,
	sendServerError,
	sendRequestError,
	sendFileAsAttachment,
	execPromise,
} = require("./utils");

function uploadImage(req, res) {
	upload(req, res, async (processed_req, _processed_res) => {
		const [err, data] = await execPromise(async () => {
			const name = processed_req.body["name"];
			const textures =
				Array.isArray(processed_req.body["textures"])
					? processed_req.body["textures"].join(",")
					: processed_req.body["textures"];
			const blob = processed_req.body["blob"];

			if (!name?.length) return sendRequestError(res, "Name is not provided!");
			if (!blob?.type?.length) return sendRequestError(res, "File is not provided!");
			if (!textures?.length) return sendRequestError(res, "No textures selected!");

			const { id } = await db.insert('file', {
				data: { name: blob.filename, mime: blob.type, blob: Buffer.from(blob.data).toString("base64") },
				returning: ['id']
			});

			const { id: imageId } = await db.insert('image', {
				data: { name, file_id: id, textures },
				returning: ['id']
			});

			return imageListItem({
				file_id: id,
				filename: blob.filename,
				id: imageId,
				name,
				textures
			});
		});

		if (err) {
			console.error(err);
			sendServerError(res, "Could not upload image!");
		}

		sendHtml(res, data);
	});
}

function uploadTexture(req, res) {
	upload(req, res, async (processed_req, _processed_res) => {
		const [err, data] =await execPromise(async () => {
			const name = processed_req.body["name"];
			const blob = processed_req.body["blob"];
			const audio_blob = processed_req.body["audio_blob"];

			if (!name?.length) return sendRequestError(res, "Name is not provided!");
			if (!blob?.type?.length) return sendRequestError(res, "File is not provided!");
			if (!audio_blob?.type?.length) return sendRequestError(res, "File is not provided!");

			const { id } = await db.insert('file', {
				data: { name: blob.filename, mime: blob.type, blob: Buffer.from(blob.data).toString("base64") },
				returning: ['id']
			});

			const { id: audioFileId } = await db.insert('file', {
				data: { name: audio_blob.filename, mime: audio_blob.type, blob: Buffer.from(audio_blob.data).toString("base64") },
				returning: ['id']
			});

			const { id: textureId } = await db.insert('texture', {
				data: { name, file_id: id, audio_file_id: audioFileId },
				returning: ['id']
			});

			return (textureListItem({
				file_id: id,
				filename: blob.filename,
				id: textureId,
				name,
				audio_file_id: audioFileId,
			}) ?? "") + textureSelectorItem({
				id: textureId,
				name,
				oob: "beforeend: #textures-checkbox-list",
			});
		});

		if  (err) {
			console.error(err.message);
			sendServerError(res, "Could not upload texture!");
		}

		sendHtml(res, data);
	});
}

async function patchImage(req, res) {
	parseFormData(req, req, async (processed_req, _processed_res) => {
		const imageId = Number(
			url.parse(req.url).pathname.split("/patch/image/")[1]
		);

		const [err, data] = await execPromise(async () => {
			const name = req.body["name"];
			const textures = req.body["textures"]?.join(',');

			if (!imageId) return sendRequestError(res, `No image id was provided.`);

			const {file_id} = await db.update('image', {
				where: {id: Number(imageId)},
				data: {name, textures},
				returning: ['file_id']
			});

			const { name: filename } = await db.find("file", {
				where: {id: file_id},
				select: ['name'],
				singleResult: true
			});

			return imageListItem({
				file_id,
				filename,
				id: imageId,
				name,
				textures
			})
		});

		if (err) {
			console.error(err.message);
			sendServerError(res, "Could not patch image!");
		}

		sendHtml(res, data);
	});
}

async function patchTexture(req, res) {
	parseFormData(req, req, async (processed_req, _processed_res) => {
		const textureId = Number(
			url.parse(req.url).pathname.split("/patch/texture/")[1]
		);

		const [err, data] = await execPromise(async () => {
			const name = req.body["name"];

			if (!textureId) return sendRequestError(res, `No texture id was provided.`);

			const { file_id, audio_file_id } = await db.update('texture', {
				where: { id: Number(textureId) },
				data: { name },
				returning: ['file_id', 'audio_file_id']
			});

			const { name: filename } = await db.find("file", {
				where: { id: file_id },
				select: ['name'],
				singleResult: true
			});

			return (textureListItem({
				file_id,
				filename,
				id: textureId,
				name,
				audio_file_id
			}) ?? "") + textureSelectorItem({
				id: textureId,
				name,
				oob: `outerHTML: #texture-checkbox-${textureId}`,
			});
		});

		if (err) {
			console.error(err.message);
			sendServerError(res, "Could not patch texture!");
		}

		sendHtml(res, data);
	});
}

async function getImages(req, res) {
	const [err, data] = await execPromise(async () => {
		const result = await db.find('image', {
			join: { file: { foreignKey: 'file_id', select: [['name', 'filename']] } },
		});

		return result
			?.reverse()?.map(v => imageListItem({
				id: v.id,
				file_id: v.file_id,
				filename: v.filename,
				name: v.name,
				textures: v.textures
			}))
			?.join("") ?? "";
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not get images!");
	}

	sendHtml(res, data);
}

async function getImage(req, res) {
	const imageId = Number(
		url.parse(req.url).pathname.split("/images/")[1]
	);

	const [err, data] = await execPromise(async () => {
		const result = await db.find('image', {
			where: { id: imageId },
			join: { file: { foreignKey: 'file_id', select: [['name', 'filename']] } },
			singleResult: true
		});

		return imageListItem({
				id: imageId,
				file_id: result.file_id,
				filename: result.filename,
				name: result.name,
				textures: result.textures
			}) ?? "";
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not get image!");
	}

	sendHtml(res, data);
}

async function getTextures(req, res) {
	const [err, data] = await execPromise(async () => {
		const result = await db.find('texture', {
			join: { file: { foreignKey: 'file_id', select: [['name', 'filename']] } },
		});

		return result
			?.reverse()?.map(v =>  textureListItem({
				id: v.id,
				file_id: v.file_id,
				filename: v.filename,
				name: v.name,
				audio_file_id: v.audio_file_id
			}))
			?.join("") ?? "";
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not get textures!");
	}

	sendHtml(res, data);
}

async function getTexture(req, res) {
	const textureId = Number(
		url.parse(req.url).pathname.split("/textures/")[1]
	);

	const [err, data] = await execPromise(async () => {
		const result = await db.find('texture', {
			where: { id: textureId },
			join: { file: { foreignKey: 'file_id', select: [['name', 'filename']] } },
			singleResult: true
		});

		return textureListItem({
			id: textureId,
			file_id: result.file_id,
			filename: result.filename,
			name: result.name,
			audio_file_id: result.audio_file_id
		}) ?? "";
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not get texture!");
	}

	sendHtml(res, data);
}

async function getTexturesList(req, res) {
	const legend = inputLegend("Select textures: ");

	const [err, data] = await execPromise(async () => {

		const result = await db.find('texture');

		if (result?.length) return legend + result
			?.map(v => textureSelectorItem({
				id: v.id,
				name: v.name,
			}))
			?.join("") ?? "";
		else return legend + paragraph("No textures to choose from.");
	});

	if (err) {
		console.error(err.message);
		sendHtml(res, legend + textureSelectorRetryFetching());
	}

	sendHtml(res, data);
}

async function getHistory(req, res) {
	const [err, data] = await execPromise(async () => {
		const history = await db.find('history');

		for (let i = 0; i < history?.length ?? 0; i++) {
			if (history[i].images?.length)
				history[i].images = await db.find('image', {
					hardCondition: history[i].images.split(',').map(v => `id = ${v}`).join(" OR "),
				});

			history[i].textures = await db.find('texture', {
				hardCondition: history[i].textures.split(',').map(v => `id = ${v}`).join(" OR "),
			});
		}

		return history
			?.reverse()?.map(v =>  historyItem({
				created_at: v.created_at,
				textures: v.textures,
				images: v.images,
				id: v.id
			}))
			?.join("") ?? "";
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not get textures!");
	}

	sendHtml(res, data);
}

async function generateImage(req, res) {
	parseFormData(req, res, async (processed_req, _processed_res) => {
			const [err, data] = await execPromise(async () => {
				const selectedTextures = processed_req.body["selectedTextures"];

				const result = await db.find('image', {
					hardCondition: selectedTextures.split(',').map(v => `textures LIKE '%${Number(v)}%'`).join(" AND "),
				});

				await db.insert('history', {
					data: { images: !result?.length? null: result.map(r => r.id).join(","), textures: selectedTextures }
				});

				return !result?.length
					? paragraph("No matching image.")
					: result?.map( r => generatedImage({
						name: r.name,
						id: r.id,
						file_id: r.file_id
					}))?.join("") ?? "";
			});

			if (err) {
				console.error(err.message);
				sendServerError(res, "Could not generate image!");
			}

			sendHtml(res, data);
	});
}

async function downloadFile(req, res) {
	const fileId = Number(
		url.parse(req.url).pathname.split("/download/")[1]
	);

	const [err] = await execPromise(async () => {
		const fileData = await db.find('file', {
			where: { id: Number(fileId) },
			singleResult: true
		});

		if (!fileData) return sendNotFoundError(res, `Could not find file ${fileId}.`);

		sendFileAsAttachment(res, fileData);
	});

	if (err) {
		console.error(err.message);
		sendServerError(res, "Could not send file!");
	}
}

module.exports = {
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
}