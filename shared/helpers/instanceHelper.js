/**
 * @typedef {import("../types").Connection} Connection
 * @typedef {import("../types").NameMap} NameMap
 */

const { queryHelper } = require('./queryHelper');

/**
 * @param {{ connection: Connection }}
 * @returns {Promise<string>}
 */
const getDbVersion = async ({ connection }) => {
	const query = queryHelper.getDbVersionQuery();
	const result = await connection.execute(query);
	const rawVersion = result?.[0]?.SERVICE_LEVEL || '';
	const [version] = /v\d+.\d+/gi.exec(rawVersion) || [''];

	return version;
};

/**
 * @param {{ connection: Connection }}
 * @returns {Promise<string[]>}
 */
const getSchemaNames = async ({ connection }) => {
	const query = queryHelper.getSchemasQuery();
	const result = await connection.execute(query);

	return result.map(row => row.SCHEMANAME);
};

/**
 * @param {{ connection: Connection, tableType: string, tableNameModifier: (name: string) => string }}
 * @returns {Promise<NameMap>}
 */
const getDatabasesWithTableNames = async ({ connection, tableType, tableNameModifier }) => {
	const query = queryHelper.getTableNamesQuery({ tableType });
	const result = await connection.execute(query);

	return result.reduce((result, { SCHEMANAME, TABLENAME }) => {
		return {
			...result,
			[SCHEMANAME]: [...(result[SCHEMANAME] || []), tableNameModifier(TABLENAME)],
		};
	}, {});
};

const instanceHelper = {
	getDbVersion,
	getSchemaNames,
	getDatabasesWithTableNames,
};

module.exports = {
	instanceHelper,
};
