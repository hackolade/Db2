/**
 * @typedef {import("../types").Connection} Connection
 * @typedef {import("../types").NameMap} NameMap
 * @typedef {import("../types").Logger} Logger
 */

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
 * @param {{ connection: Connection, objectType: string, includeSystemCollection: boolean, tableNameModifier: (name: string) => string }}
 * @returns {Promise<NameMap>}
 */
const getDatabasesWithTableNames = async ({ connection, objectType, includeSystemCollection, tableNameModifier }) => {
	const query = queryHelper.getTableNamesQuery({ objectType, includeSystemCollection });
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
const getTableDdl = async ({ connection, schemaName, tableName, objectType, logger }) => {
	try {
		const generateQuery = queryHelper.getGenerateTableDdlQuery({ schemaName, tableName, objectType });

		const opToken = await connection.execute({ query: generateQuery, callable: true });

		const selectQuery = queryHelper.getSelectTableDdlQuery({
			opToken,
			schemaName,
			objectName: tableName,
			objectType,
		});

		const ddlResult = await connection.execute({ query: selectQuery });

		const clearQuery = queryHelper.getClearTableDdlQuery();

		await connection.execute({ query: clearQuery, callable: true, inparam: opToken });

		return ddlResult.map(queryHelper.postProcessDdlStatement).join('\n');
	} catch (error) {
		logger.error(error);

		return '';
	}
};

/**
 * @param {{ connection: Connection, query: string, ddl?: boolean }}
 * @returns {Promise<void>}
 */
const executeQuery = async ({ connection, query, ddl = false }) => await connection.execute({ query, ddl });

const instanceHelper = {
	getDbVersion,
	getSchemaNames,
	getSchemaProperties,
	getDatabasesWithTableNames,
	getTableDdl,
	executeQuery,
};

module.exports = {
	instanceHelper,
};
