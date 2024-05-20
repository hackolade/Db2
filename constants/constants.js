const ERROR_MESSAGE = {
	missingJavaPath:
		'Path to JAVA binary file is incorrect. Please specify JAVA_HOME variable in your system or put specific path to JAVA binary file in connection settings.',
};

/**
 * @enum {string}
 */
const TABLE_TYPE = {
	table: 'TABLE',
	view: 'VIEW',
};

module.exports = {
	ERROR_MESSAGE,
	TABLE_TYPE,
};
