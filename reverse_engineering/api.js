/**
 * @typedef {import('../shared/types').App} App
 * @typedef {import('../shared/types').AppLogger} AppLogger
 * @typedef {import('../shared/types').ConnectionInfo} ConnectionInfo
 * @typedef {import('../shared/types').Logger} Logger
 * @typedef {import('../shared/types').Callback} Callback
 */

const { connectionHelper } = require('../shared/helpers/connectionHelper');
const { instanceHelper } = require('../shared/helpers/instanceHelper');
const { logHelper } = require('../shared/helpers/logHelper');

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
		const version = await instanceHelper.getVersion({ connection });

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
		await connectionHelper.disconnect();
		const connection = await connectionHelper.connect({ connectionInfo, logger });
		const version = await instanceHelper.getVersion({ connection });
		await connectionHelper.disconnect();

		logger.info('Db version: ' + version);
		callback();
	} catch (error) {
		logger.error(error);
		callback(error);
	}
};

const getSchemaNames = async (connectionInfo, logger, callback, app) => {
	throw new Error('Not implemented');
};

const getDbCollectionsNames = async (connectionInfo, logger, callback, app) => {
	throw new Error('Not implemented');
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
