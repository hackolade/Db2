const db2 = require('ibm_db');

let database = null;

/**
 * @param {{ connectionInfo: ConnectionInfo, app: App }}
 * @throws {Error}
 * @returns {Promise<object>}
 */
const connect = async ({ connectionInfo, app }) => {
	if (database) {
		return database;
	}

	database = await db2.open(
		{
			DATABASE: connectionInfo.database,
			HOSTNAME: connectionInfo.host,
			PORT: connectionInfo.port,
			UID: connectionInfo.userName,
			PWD: connectionInfo.userPassword,
		},
		{
			connectTimeout: connectionInfo.connectTimeout,
		},
	);

	return database;
};

/**
 * @returns {Promise<void>}
 */
const disconnect = async () => {
	await database?.close();
};

const connectionHelper = {
	connect,
	disconnect,
};

module.exports = {
	connectionHelper,
};
