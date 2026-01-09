const { logHelper } = require('../../shared/helpers/logHelper');
const { connectionHelper } = require('../../shared/helpers/connectionHelper');
const { instanceHelper } = require('../../shared/helpers/instanceHelper');

async function applyToInstance(connectionInfo, logger, callback, app) {
	const applyToInstanceLogger = logHelper.createLogger({
		title: 'Apply to instance',
		hiddenKeys: connectionInfo.hiddenKeys,
		logger,
	});

	try {
		const connection = await connectionHelper.connect({ connectionInfo, logger: applyToInstanceLogger });
		await instanceHelper.executeQuery({ connection, query: connectionInfo.script });

		callback();
	} catch (err) {
		applyToInstanceLogger.error(err);
		callback(err);
	}
}

module.exports = { applyToInstance };
