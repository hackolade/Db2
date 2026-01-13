const { logHelper } = require('../helpers/logHelper');
const { connectionHelper } = require('../helpers/connectionHelper');
const { instanceHelper } = require('../helpers/instanceHelper');

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

module.exports = { testConnection };
