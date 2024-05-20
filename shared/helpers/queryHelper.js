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
 * @param {{ tableType: string }}
 * @returns {string}
 */
const getTableNamesQuery = ({ tableType }) => {
	const baseQuery = `SELECT TABLE_SCHEM AS SCHEMANAME, TABLE_NAME AS TABLENAME FROM SYSIBM.SQLTABLES WHERE TABLE_TYPE = '${tableType}'`;
	const query = getNonSystemSchemaWhereClause({ query: baseQuery, schemaNameKeyword: 'TABLE_SCHEM' });

	return cleanUpQuery({ query });
};

const queryHelper = {
	getDbVersionQuery,
	getSchemasQuery,
	getTableNamesQuery,
};

module.exports = {
	queryHelper,
};
