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

const INLINE_COMMENT = '--';

const PERCENT = '__PERCENT__';

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
	TABLE_TYPE,
	INLINE_COMMENT,
	PERCENT,
	CONSTRAINT_POSTFIX,
};
