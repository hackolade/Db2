'use strict';
module.exports = {
	async connect(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	async disconnect(connectionInfo, logger, callback) {
		throw new Error('Not implemented');
	},

	async testConnection(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	async getSchemaNames(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	async getDbCollectionsNames(connectionInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},

	async getDbCollectionsData(collectionsInfo, logger, callback, app) {
		throw new Error('Not implemented');
	},
};
