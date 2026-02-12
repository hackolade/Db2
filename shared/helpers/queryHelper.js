const { OBJECT_TYPE } = require('../../constants/constants');

/**
 * @param {{ query: string }} params
 * @returns {string}
 */
const cleanUpQuery = ({ query = '' }) => query.replaceAll(/\s+/g, ' ');

const ensureTerminator = ({ query = '' }) => (query.trimEnd().endsWith(';') ? query : `${query};`);

/**
 * finds every quoted identifier and removes *only* trailing whitespace
 * @param {{ query: string }} params
 * @returns {string}
 */
const normalizeDb2Identifiers = ({ query = '' }) => {
	return query.replaceAll(/"([^"]*)"/g, (_, name) => `"${name.trimEnd()}"`);
};

/**
 * @param {{ query: string, schemaNameKeyword: string }} params
 * @returns {string}
 */
const getNonSystemSchemaWhereClause = ({ query, schemaNameKeyword }) => {
	const whereClause = `
	  WHERE ${schemaNameKeyword} NOT LIKE 'SYS%'
	  AND ${schemaNameKeyword} NOT LIKE '%SYSCAT%'
	  AND ${schemaNameKeyword} NOT LIKE '%SYSIBM%'
	  AND ${schemaNameKeyword} NOT LIKE '%SYSSTAT%'
	  AND ${schemaNameKeyword} NOT LIKE '%SYSTOOLS%'
	  AND ${schemaNameKeyword} NOT LIKE '%NULLID%'
	  AND ${schemaNameKeyword} NOT LIKE '%SQLJ%';`;

	const clause = query.includes('WHERE') ? whereClause.replace('WHERE', 'AND') : whereClause;

	return query + clause;
};

/**
 * @returns {string}
 */
const getDbVersionQuery = () => {
	return 'SELECT SERVICE_LEVEL FROM SYSIBMADM.ENV_INST_INFO';
};

/**
 * @returns {string}
 */
const getSchemasQuery = () => {
	const baseQuery = 'SELECT SCHEMANAME FROM SYSCAT.SCHEMATA';
	const query = getNonSystemSchemaWhereClause({ query: baseQuery, schemaNameKeyword: 'SCHEMANAME' });

	return cleanUpQuery({ query });
};

/**
 * @param {{ schemaName: string }} params
 * @returns {string}
 */
const getSchemaQuery = ({ schemaName }) => {
	return `SELECT * FROM SYSCAT.SCHEMATA WHERE SCHEMANAME = '${schemaName}'`;
};

/**
 * @param {{ objectType: string, includeSystemCollection: boolean }} params
 * @returns {string}
 */
const getTableNamesQuery = ({ objectType, includeSystemCollection }) => {
	const baseQuery = `SELECT TABLE_SCHEM AS SCHEMANAME, TABLE_NAME AS TABLENAME FROM SYSIBM.SQLTABLES WHERE TABLE_TYPE = '${objectType}'`;

	if (includeSystemCollection) {
		return baseQuery;
	}

	const query = getNonSystemSchemaWhereClause({ query: baseQuery, schemaNameKeyword: 'TABLE_SCHEM' });

	return cleanUpQuery({ query });
};

/**
 * @param {{ schemaName: string, tableName: string, objectType: string }} params
 * @returns {string};
 */
const getGenerateTableDdlQuery = ({ schemaName, tableName, objectType }) => {
	const objectArgument = objectType === OBJECT_TYPE.table ? '-t' : '-v';

	return `CALL SYSPROC.DB2LK_GENERATE_DDL('-a -e -z "${schemaName}" ${objectArgument} "${tableName}"', ?);`;
};

/**
 * @param {{ opToken: number, schemaName: string, objectName: string, objectType: string }} params
 * @returns {string}
 */
const getSelectTableDdlQuery = ({ opToken, schemaName, objectName, objectType }) => {
	const predicate =
		objectType === OBJECT_TYPE.view
			? `SQL_STMT LIKE 'CREATE%VIEW %"${schemaName}%"."${objectName}"%'
				OR SQL_STMT LIKE 'CREATE%VIEW "${objectName}"%'
				OR SQL_STMT LIKE 'CREATE%VIEW ${objectName}%'
				OR SQL_STMT LIKE 'COMMENT ON TABLE %"${schemaName}%"."${objectName}"%'`
			: `SQL_STMT LIKE '%"${schemaName}%"."${objectName}"%'`;

	const query = `
		SELECT SQL_STMT
		FROM SYSTOOLS.DB2LOOK_INFO
		WHERE OP_TOKEN = ${opToken}
		  AND ( ${predicate} )
		ORDER BY CREATION_TIME, OP_SEQUENCE
	`;

	return cleanUpQuery({ query });
};

/**
 * @returns {string}
 */
const getClearTableDdlQuery = () => {
	return 'CALL SYSPROC.DB2LK_CLEAN_TABLE(?);';
};

/**
 * @param {{ SQL_STMT: string}} row - select query ddl result
 * @returns {string}
 */
const postProcessDdlStatement = row => {
	let statement = queryHelper.ensureTerminator({ query: row.SQL_STMT });
	statement = queryHelper.normalizeDb2Identifiers({ query: statement });
	return statement;
};

const queryHelper = {
	cleanUpQuery,
	getDbVersionQuery,
	getSchemaQuery,
	getSchemasQuery,
	getTableNamesQuery,
	getGenerateTableDdlQuery,
	getSelectTableDdlQuery,
	getClearTableDdlQuery,
	ensureTerminator,
	normalizeDb2Identifiers,
	postProcessDdlStatement,
};

module.exports = {
	queryHelper,
};
