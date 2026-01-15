const { TABLE_TYPE, PERSENT } = require('../../constants/constants');

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
	// On Windows (cmd.exe), environment variables can be referenced using syntax like %PATH%.
	// When a command contains such patterns, cmd.exe automatically replaces them with the corresponding environment variable values.
	// To prevent this automatic substitution, a placeholder string (PERSENT) is used here instead,
	// which will later be replaced with the % symbol inside the Db2Client Java client.
	const whereClause = `
	  WHERE ${schemaNameKeyword} NOT LIKE 'SYS${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}SYSCAT${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}SYSIBM${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}SYSSTAT${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}SYSTOOLS${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}NULLID${PERSENT}'
	  AND ${schemaNameKeyword} NOT LIKE '${PERSENT}SQLJ${PERSENT}';`;

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

	return `CALL SYSPROC.DB2LK_GENERATE_DDL('-a -e -z "${schemaName}" ${tableArgument} "${tableName}"', ?);`;
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
