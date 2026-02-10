const ERROR_MESSAGE = {
	missingJavaPath:
		'Path to JAVA binary file is incorrect. Please specify JAVA_HOME variable in your system or put specific path to JAVA binary file in connection settings.',
};

/**
 * @enum {string}
 */
const OBJECT_TYPE = {
	table: 'TABLE',
	view: 'VIEW',
};

const INLINE_COMMENT = '--';

const CONSTRAINT_POSTFIX = {
	primaryKey: 'pk',
	foreignKey: 'fk',
	uniqueKey: 'uk',
	notNull: 'nn',
	check: 'check',
	default: 'default',
};

module.exports = {
	ERROR_MESSAGE,
	OBJECT_TYPE,
	INLINE_COMMENT,
	CONSTRAINT_POSTFIX,
};
