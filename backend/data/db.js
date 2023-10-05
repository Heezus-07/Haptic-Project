const sqlite3 = require("./sqlite3/sqlite3.js");

async function getLastInsertedRowId() {
	return await sqlite3.sendCommandToSQLite(`SELECT last_insert_rowid();`);
}

function morphDataForSQLite(data) {
	return typeof data === "string"? `'${data}'`: data === null? "NULL": data
}

function processCondition(condition = {}) {
	return Object.entries(condition)
		.filter(v => v[0] !== undefined)
		.map(v => `${v[0]} = ${morphDataForSQLite(v[1])}`)
		.join(", ");
}

function processInsertData(data = {}) {
	const keys = Object.keys(data).join(", ");
	const values =
		Object.values(data)
			.filter(v => v !== undefined)
			.map(v => morphDataForSQLite(v))
			.join(", ");

	return { keys, values };
}

function processUpdateData(data = {}) {
	return processCondition(data);
}

function processReturning(returning) {
	return returning?.length? returning.join(", "): '';
}

function processSelect(select = [], table) {
	const returnable =
		select
			.map(v =>
				Array.isArray(v)
					? `${table}.${v[0]} AS ${v[1]}`
					: `${table}.${v}`
			)
			.join(", ");

	return returnable?.length? returnable: `${table}.*`;
}

function processJoin(data = {}, table) {
	const keys = [];
	const on = [];
	const conditions = [];

	Object
		.entries(data)
		.forEach(v => {
			keys.push(processSelect(v[1].select, v[0]));
			on.push(`JOIN ${v[0]} ON ${v[0]}.${v[1]['referenceKey'] ?? 'id'} = ${table}.${v[1]['foreignKey']}`);
			conditions.push(processCondition(v[1].where));
		});

	return { keys: keys.join(", "), conditions: conditions.join(", "), on: on.join(" ") };
}

async function insert(table, config) {
	const { keys, values } = processInsertData(config["data"]);

	const returning = processReturning(config["returning"]);

	const queryResult = await sqlite3.sendCommandToSQLite(
		`INSERT INTO ${table} (${keys}) VALUES (${values}) ${returning? `RETURNING ${returning}`: ''};`
	);

	return sqlite3.getData(table, queryResult, { keys: config["returning"], singleResult: true });
}

async function update(table, config) {
	const condition = processCondition(config["where"]);
	const data = processUpdateData(config["data"]);
	const returning = processReturning(config["returning"]);

	const queryResult = await sqlite3.sendCommandToSQLite(
		`UPDATE ${table} SET ${data} WHERE ${condition} ${returning? `RETURNING ${returning}`: ''};`
	);

	return sqlite3.getData(table, queryResult, { keys: config["returning"], singleResult: true });
}

async function find(table, config) {
	const condition = processCondition(config?.["where"]);
	const select = processSelect(config?.['select'], table);
	const hardCondition = config?.["hardCondition"] ?? "";
	const limit = config?.["limit"];
	const { keys, on, conditions } = processJoin(config?.['join'], table);

	const queryResult = await sqlite3.sendCommandToSQLite(
		`SELECT ${select}${keys? `, ${keys}`: ''} FROM ${table}${on? ` ${on}`: ''}${!condition && !conditions && !hardCondition? '': ` WHERE ${hardCondition}${hardCondition && condition? `, ${condition}`: condition}${(condition || hardCondition) && conditions? `, ${conditions}`: conditions}`}${limit? ` LIMIT ${limit}`: ''};`
	);

	return sqlite3.getData(table, queryResult, { singleResult: config?.singleResult });
}

async function remove(table, config) {
	const condition = processCondition(config["where"]);
	const returning = processReturning(config["returning"]);

	const queryResult = await sqlite3.sendCommandToSQLite(
		`DELETE FROM ${table} WHERE ${condition} ${returning? `RETURNING ${returning}`: ''};`
	);

	return sqlite3.getData(table, queryResult, { keys: config["returning"], singleResult: true });
}

module.exports = {
	getLastInsertedRowId,
	insert,
	update,
	find,
	remove
};