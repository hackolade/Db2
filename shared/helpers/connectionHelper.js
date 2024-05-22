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
 * @param {string} argKey
 * @param {string | number} argValue
 * @returns {string}
 */
const createArgument = (argKey, argValue) => ` --${argKey}="${argValue}"`;

/**
 * @param {{ [argKey: string]: string }} queryData
 * @returns {string[]}
 */
const getQueryArguments = queryData => {
	return Object.entries(queryData).reduce((result, [argKey, argValue]) => {
		return [...result, createArgument(argKey, argValue)];
	}, []);
};

/**
 * @param {{ clientPath: string, connectionInfo: ConnectionInfo }}
 * @returns {string[]}
 */
const buildCommand = ({ clientPath, connectionInfo }) => {
	let commandArgs = ['-jar', clientPath];

	connectionInfo.host && commandArgs.push(createArgument('host', connectionInfo.host));
	connectionInfo.port && commandArgs.push(createArgument('port', connectionInfo.port));
	connectionInfo.database && commandArgs.push(createArgument('database', connectionInfo.database));
	connectionInfo.userName && commandArgs.push(createArgument('user', connectionInfo.userName));
	connectionInfo.userPassword && commandArgs.push(createArgument('pass', connectionInfo.userPassword));

	return commandArgs;
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
		const testCommand = `"${javaPath}" --help`;
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
	const clientCommandArguments = buildCommand({ clientPath, connectionInfo });

	return {
		execute: queryData => {
			return new Promise((resolve, reject) => {
				const queryArguments = getQueryArguments(queryData);
				const queryResult = spawn(`"${javaPath}"`, [...clientCommandArguments, ...queryArguments], {
					shell: true,
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
