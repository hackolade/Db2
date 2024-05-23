const { TABLE_TYPE } = require('../../constants/constants');

/**
 * @param {{ query: string }}
 * @returns {string}
 */
const cleanUpQuery = ({ query = '' }) => query.replaceAll(/\s+/g, ' ');

/**
 * @param {{ query: string, schemaNameKeyword: string }}
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
 * @param {{ schemaName: string }}
 * @returns {string}
 */
const getSchemaQuery = ({ schemaName }) => {
	return `SELECT * FROM SYSCAT.SCHEMATA WHERE SCHEMANAME = '${schemaName}'`;
};

/**
 * @param {{ tableType: string, includeSystemCollection: boolean }}
 * @returns {string}
 */
const getTableNamesQuery = ({ tableType, includeSystemCollection }) => {
	const baseQuery = `SELECT TABLE_SCHEM AS SCHEMANAME, TABLE_NAME AS TABLENAME FROM SYSIBM.SQLTABLES WHERE TABLE_TYPE = '${tableType}'`;

	if (includeSystemCollection) {
		return baseQuery;
	}

	const query = getNonSystemSchemaWhereClause({ query: baseQuery, schemaNameKeyword: 'TABLE_SCHEM' });

	return cleanUpQuery({ query });
};

/**
 * @param {{ schemaName: string, tableName: string, tableType: string }}
 * @returns {string};
 */
const getGenerateTableDdlQuery = ({ schemaName, tableName, tableType }) => {
	const tableArgument = tableType === TABLE_TYPE.table ? '-t' : '-v';

	return `CALL SYSPROC.DB2LK_GENERATE_DDL('-a -e -z ${schemaName} ${tableArgument} ${tableName}', ?);`;
};

/**
 * @param {{ opToken: number, tableType: string }}
 * @returns {string}
 */
const getSelectTableDdlQuery = ({ opToken, tableType }) => {
	const objectTypeOperator = tableType === TABLE_TYPE.table ? '!=' : '=';
	const query = `
	SELECT SQL_STMT
	FROM SYSTOOLS.DB2LOOK_INFO
	WHERE OP_TOKEN= ${opToken}
	AND OBJ_TYPE ${objectTypeOperator} '${TABLE_TYPE.view}'
	ORDER BY CREATION_TIME, OP_SEQUENCE;`;

	return cleanUpQuery({ query });
};

/**
 * @returns {string}
 */
const getClearTableDdlQuery = () => {
	return 'CALL SYSPROC.DB2LK_CLEAN_TABLE(?);';
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
};

module.exports = {
	queryHelper,
};
