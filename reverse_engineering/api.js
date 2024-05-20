/**
 * @typedef {import('../shared/types').App} App
 * @typedef {import('../shared/types').AppLogger} AppLogger
 * @typedef {import('../shared/types').ConnectionInfo} ConnectionInfo
 * @typedef {import('../shared/types').Logger} Logger
 * @typedef {import('../shared/types').Callback} Callback
 */

const { identity } = require('lodash');
const { connectionHelper } = require('../shared/helpers/connectionHelper');
const { instanceHelper } = require('../shared/helpers/instanceHelper');
const { logHelper } = require('../shared/helpers/logHelper');
const { TABLE_TYPE } = require('../constants/constants');

/**
 * @param {ConnectionInfo} connectionInfo
 * @param {AppLogger} appLogger
 * @param {Callback} callback
 * @param {App} app
 */
const connect = async (connectionInfo, appLogger, callback, app) => {
	const logger = logHelper.createLogger({
		title: 'Connect to database',
		hiddenKeys: connectionInfo.hiddenKeys,
		logger: appLogger,
	});

	try {
		await connectionHelper.disconnect();
		const connection = await connectionHelper.connect({ connectionInfo, logger });
		const version = await instanceHelper.getDbVersion({ connection });

		logger.info('Db version: ' + version);
		callback();
	} catch (error) {
		logger.error(error);
		callback(error);
	}
};

/**
 * @param {ConnectionInfo} connectionInfo
 * @param {AppLogger} appLogger
 * @param {Callback} callback
 */
const disconnect = async (connectionInfo, appLogger, callback) => {
	try {
		await connectionHelper.disconnect();
		callback();
	} catch (error) {
		const logger = logHelper.createLogger({
			title: 'Disconnect from database',
			hiddenKeys: connectionInfo.hiddenKeys,
			logger: appLogger,
		});

		logger.error(error);
		callback(error);
	}
};

/**
 * @param {ConnectionInfo} connectionInfo
 * @param {AppLogger} appLogger
 * @param {Callback} callback
 * @param {App} app
 */
const testConnection = async (connectionInfo, appLogger, callback, app) => {
	const logger = logHelper.createLogger({
		title: 'Test database connection',
		hiddenKeys: connectionInfo.hiddenKeys,
		logger: appLogger,
	});

	try {
		logger.info(connectionInfo);
		await connectionHelper.disconnect();
		const connection = await connectionHelper.connect({ connectionInfo, logger });
		const version = await instanceHelper.getDbVersion({ connection });
		await connectionHelper.disconnect();

		logger.info('Db version: ' + version);
		callback();
	} catch (error) {
		logger.error(error);
		callback(error);
	}
};

/**
 * @param {ConnectionInfo} connectionInfo
 * @param {AppLogger} appLogger
 * @param {Callback} callback
 * @param {App} app
 */
const getSchemaNames = async (connectionInfo, appLogger, callback, app) => {
	const logger = logHelper.createLogger({
		title: 'Retrieve schema names',
		hiddenKeys: connectionInfo.hiddenKeys,
		logger: appLogger,
	});

	try {
		const connection = await connectionHelper.connect({ connectionInfo, logger });
		const schemaNames = await instanceHelper.getSchemaNames({ connection });

		callback(null, schemaNames);
	} catch (error) {
		logger.error(error);
		callback(error);
	}
};

/**
 * @param {ConnectionInfo} connectionInfo
 * @param {AppLogger} appLogger
 * @param {Callback} callback
 * @param {App} app
 */
const getDbCollectionsNames = async (connectionInfo, appLogger, callback, app) => {
	const logger = logHelper.createLogger({
		title: 'Retrieve table names',
		hiddenKeys: connectionInfo.hiddenKeys,
		logger: appLogger,
	});

	try {
		logger.info('Get table and schema names');

		const connection = await connectionHelper.connect({ connectionInfo, logger });
		const tableNames = await instanceHelper.getDatabasesWithTableNames({
			connection,
			tableType: TABLE_TYPE.table,
			tableNameModifier: identity,
		});

		logger.info('Get views and schema names');
		logger.info(JSON.stringify(connection));
		const viewNames = await instanceHelper.getDatabasesWithTableNames({
			connection,
			tableType: TABLE_TYPE.view,
			tableNameModifier: name => `${name} (v)`,
		});
		const allDatabaseNames = [...Object.keys(tableNames), ...Object.keys(viewNames)];
		const dbCollectionNames = allDatabaseNames.map(dbName => {
			const dbCollections = [...(tableNames[dbName] || []), ...(viewNames[dbName] || [])];

			return {
				dbName,
				dbCollections,
				isEmpty: !!dbCollections.length,
			};
		});

		logger.info('Names retrieved successfully');

		callback(null, dbCollectionNames);
	} catch (error) {
		logger.error(error);
		callback(error);
	}
};

const getDbCollectionsData = async (collectionsInfo, logger, callback, app) => {
	throw new Error('Not implemented');
};

module.exports = {
	connect,
	disconnect,
	testConnection,
	getSchemaNames,
	getDbCollectionsNames,
	getDbCollectionsData,
};
