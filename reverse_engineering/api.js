const { connectionHelper } = require('../shared/helpers/connectionHelper');
const { logHelper } = require('../shared/helpers/logHelper');

const connect = async (connectionInfo, logger, callback, app) => {
	throw new Error('Not implemented');
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
	try {
		await connectionHelper.disconnect();
		await connectionHelper.connect({ connectionInfo });
		await connectionHelper.disconnect();
		callback();
	} catch (error) {
		const logger = logHelper.createLogger({
			title: 'Test database connection',
			hiddenKeys: connectionInfo.hiddenKeys,
			logger: appLogger,
		});

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
