/**
 * @typedef {import("../types").Connection} Connection
 * @typedef {import("../types").NameMap} NameMap
 * @typedef {import("../types").Logger} Logger
 */

const { TABLE_TYPE } = require('../../constants/constants');
const { queryHelper } = require('./queryHelper');

/**
 * @param {{ connection: Connection }}
 * @returns {Promise<string>}
 */
const getDbVersion = async ({ connection }) => {
	const query = queryHelper.getDbVersionQuery();
	const result = await connection.execute({ query });
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
	const result = await connection.execute({ query });

	return result.map(row => row.SCHEMANAME);
};

/**
 * @param {{ connection: Connection, tableType: string, includeSystemCollection: boolean, tableNameModifier: (name: string) => string }}
 * @returns {Promise<NameMap>}
 */
const getDatabasesWithTableNames = async ({ connection, tableType, includeSystemCollection, tableNameModifier }) => {
	const query = queryHelper.getTableNamesQuery({ tableType, includeSystemCollection });
	const result = await connection.execute({ query });

	return result.reduce((result, { SCHEMANAME, TABLENAME }) => {
		return {
			...result,
			[SCHEMANAME]: [...(result[SCHEMANAME] || []), tableNameModifier(TABLENAME)],
		};
	}, {});
};

/**
 * @param {{ connection: Connection, schemaName: string, logger: Logger }}
 * @returns {Promise<{ [key: string]: string }>}
 */
const getSchemaProperties = async ({ connection, schemaName, logger }) => {
	try {
		const query = queryHelper.getSchemaQuery({ schemaName });
		const result = await connection.execute({ query });

		return (result || []).reduce((acc, row) => {
			return {
				...acc,
				authorizationName: row.OWNER,
				dataCapture: row.DATACAPTURE === 'Y' ? 'CHANGES' : 'NONE',
			};
		}, {});
	} catch (error) {
		logger.error(error);
		return {};
	}
};

/**
 * @param {{ connection: Connection, schemaName: string, tableName: string, tableName: string, logger: Logger}}
 * @returns {Promise<string>}
 */
const getTableDdl = async ({ connection, schemaName, tableName, tableType, logger }) => {
	try {
		const generateQuery = queryHelper.getGenerateTableDdlQuery({ schemaName, tableName, tableType });
		const opToken = await connection.execute({ query: generateQuery, callable: true });
		const selectQuery = queryHelper.getSelectTableDdlQuery({ opToken, tableType });
		const ddlResult = await connection.execute({ query: selectQuery });
		const clearQuery = queryHelper.getClearTableDdlQuery();

		await connection.execute({ query: clearQuery, callable: true, inparam: opToken });

		return ddlResult.map(row => row.SQL_STMT + ';').join('\n');
	} catch (error) {
		logger.error(error);

		return '';
	}
};

const instanceHelper = {
	getDbVersion,
	getSchemaNames,
	getSchemaProperties,
	getDatabasesWithTableNames,
	getTableDdl,
};

module.exports = {
	instanceHelper,
};
