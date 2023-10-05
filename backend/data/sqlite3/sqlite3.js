const { spawn} = require('node:child_process');
const path = require('node:path');

const sqlitePath = process.env.SQLITE3_EXEC_PATH ?? path.join(__dirname, "sqlite3");
const dbPath = process.env.DB_PATH ?? path.join(__dirname, "../data.db");
const delimiter = '---COMMAND_COMPLETE---';

let commandQueue = [];
let currentCommandOutput = '';

const sqliteProcess = spawn(sqlitePath, [dbPath], {
	stdio: ['pipe', 'pipe', 'pipe']
});

sqliteProcess.stdout.on('data', (data) => {
	const strData = data.toString();

	if (strData.includes(delimiter)) {
		const splitData = strData.split(delimiter);

		currentCommandOutput += splitData[0];

		if (commandQueue.length) {
			const { resolve } = commandQueue.shift();

			resolve(currentCommandOutput.trim());

			currentCommandOutput = splitData[1];
		}
	} else {
		currentCommandOutput += strData;
	}
});

sqliteProcess.stderr.on('data', (data) => {
	if (commandQueue.length) {
		const { reject } = commandQueue.shift();

		reject(new Error(data));
	}
});

function sendCommandToSQLite(command) {
	return new Promise((resolve, reject) => {
		commandQueue.push({ resolve, reject });
		sqliteProcess.stdin.write(command + '\n');
		sqliteProcess.stdin.write(`SELECT '${delimiter}';\n`);
	});
}

function getData(table, query_result, config) {
	if (query_result) {
		const query_results = query_result.split('\n').map(v => v.split("|"));

		const keys = config?.keys ?? [];

		const items = [];

		if (!keys.length) {
			switch (table) {
				case "file": keys.push(...["id", "name", "mime", "blob"]); break;
				case "image": keys.push(...["id", "name", "file_id", "textures", "filename"]); break;
				case "texture": keys.push(...["id", "name", "file_id", "audio_file_id", "filename"]); break;
				case "history": keys.push(...["id", "images", "textures", "created_at"]); break;
				default:
			}
		}

		query_results.forEach((v) => {
			const item = {};

			keys.forEach((key, index) => item[key] = v[index]);

			items.push(item);

		});

		return config["singleResult"]? items[0]: items;
	}
}

module.exports = { sendCommandToSQLite, getData };
