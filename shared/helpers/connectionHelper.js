/**
 * @typedef {import('../types').Connection} Connection
 * @typedef {import('../types').ConnectionInfo} ConnectionInfo
 * @typedef {import('../types').Logger} Logger
 */

const os = require('os');
const util = require('util');
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const { spawn } = require('child_process');
const { ERROR_MESSAGE } = require('../../constants/constants');

/**
 * @type {Connection | null}
 */
let connection;

/**
 * @returns {boolean}
 */
const isWindows = () => os.platform() === 'win32';

/**
 * @param {{ clientPath: string }}
 * @returns {string[]}
 */
const buildCommand = ({ clientPath }) => {
	return ['-jar', clientPath];
};

/**
 * @returns {string}
 */
const getDefaultJavaPath = () => {
	const javaHome = isWindows() ? '%JAVA_HOME%' : '$JAVA_HOME';
	return javaHome + '/bin/java';
};

/**
 * @param {{ javaHomePath: string, logger: Logger }}
 * @returns {Promise<void>}
 * @throws {Error}
 */
const checkJavaPath = async ({ javaPath, logger }) => {
	try {
		const testCommand = `"${javaPath}" -version`;
		await exec(testCommand);
		logger.info(`Path to JAVA binary file successfully checked. JAVA path: ${javaPath}`);
	} catch (error) {
		logger.error(error);
		throw new Error(ERROR_MESSAGE.missingJavaPath);
	}
};

/**
 * @param {{ connectionInfo: ConnectionInfo, logger: Logger }}
 * @returns {Promise<Connection>}
 */
const createConnection = async ({ connectionInfo, logger }) => {
	const javaPath = connectionInfo.javaHomePath || getDefaultJavaPath();

	await checkJavaPath({ javaPath, logger });

	// If you need to change this clientPath, please ensure that your changes work in the packaged plugin
	const clientPath = path.resolve(__dirname, '..', 'addons', 'Db2Client.jar');
	const clientCommandArguments = buildCommand({ clientPath });

	return {
		execute: queryData => {
			return new Promise((resolve, reject) => {
				const queryResult = spawn(`"${javaPath}"`, clientCommandArguments, {
					shell: true,
					stdio: 'pipe',
				});

				queryResult.on('error', error => {
					reject(error);
				});

				const errorData = [];
				queryResult.stderr.on('data', data => {
					errorData.push(data);
				});

				const resultData = [];
				queryResult.stdout.on('data', data => {
					resultData.push(data);
				});

				const inputJson = JSON.stringify({
					host: connectionInfo.host || '',
					port: connectionInfo.port || '',
					database: connectionInfo.database || '',
					user: connectionInfo.userName || '',
					password: connectionInfo.userPassword || '',
					query: queryData.query || '',
					callable: queryData.callable || false,
					inParam: queryData.inparam ? String(queryData.inparam) : '',
					ddl: queryData.ddl || false,
				});

				queryResult.stdin.on('error', error => {
					reject(error);
				});

				queryResult.stdin.write(inputJson, 'utf8');
				queryResult.stdin.end();

				queryResult.on('close', code => {
					if (code !== 0) {
						reject(new Error(Buffer.concat(errorData).toString()));
						return;
					}

					const stdoutResult = Buffer.concat(resultData).toString();
					const rowJson = stdoutResult.match(/<hackolade>(.*?)<\/hackolade>/)?.[1];

					if (!rowJson) {
						resolve([]);
						return;
					}

					const parsedResult = JSON.parse(rowJson);
					if (parsedResult.error) {
						reject(parsedResult.error);
						return;
					}

					resolve(parsedResult.data);
				});
			});
		},
	};
};

/**
 * @param {{ connectionInfo: ConnectionInfo, logger: Logger }}
 * @returns {Promise<Connection>}
 */
const connect = async ({ connectionInfo, logger }) => {
	if (connection) {
		return connection;
	}
	connection = await createConnection({ connectionInfo, logger });

	return connection;
};

/**
 * @returns {Promise<void>}
 */
const disconnect = async () => {
	if (connection) {
		connection = null;
	}
};

const connectionHelper = {
	connect,
	disconnect,
};

module.exports = {
	connectionHelper,
};
