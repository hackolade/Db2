/**
 * @typedef {import("../types").Connection} Connection
 */

/**
 * @param {{ connection: Connection }}
 * @returns {Promise<string>}
 */
const getVersion = async ({ connection }) => {
	const result = await connection.execute('SELECT SERVICE_LEVEL FROM SYSIBMADM.ENV_INST_INFO');
	const rawVersion = result?.[0]?.SERVICE_LEVEL || '';
	const [version] = /v\d+.\d+/gi.exec(rawVersion) || [''];

	return version;
};

const instanceHelper = {
	getVersion,
};
module.exports = {
	instanceHelper,
};
