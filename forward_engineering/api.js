const { generateContainerScript } = require('./api/generateContainerScript');
const { isDropInStatements } = require('./api/isDropInStatements');

module.exports = {
	generateScript(data, logger, callback, app) {
		throw new Error('Not implemented');
	},

	generateViewScript(data, logger, callback, app) {
		throw new Error('Not implemented');
	},

	generateContainerScript,

	getDatabases(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	applyToInstance(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	testConnection(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	isDropInStatements,
};
