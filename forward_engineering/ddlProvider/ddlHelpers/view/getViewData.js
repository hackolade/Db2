const { wrapInQuotes, getNamePrefixedWithSchemaName } = require('../../../utils/general');

/**
 * @param {{ key?: object }}
 * @returns {string}
 */
const getKeyWithAlias = ({ key }) => {
	if (!key) {
		return '';
	}

	if (key.alias) {
		return `${wrapInQuotes(key.name)} as ${wrapInQuotes(key.alias)}`;
	} else {
		return wrapInQuotes(key.name);
	}
};

/**
 * @typedef {{ statement: string, isActivated: boolean }} Column
 * @typedef {{ statement: string, isActivated: boolean }} Table
 * @param {{ keys?: object[] }}
 * @returns {{ tables: Table[], columns: Column[] }}
 */
const getViewData = ({ keys }) => {
	if (!Array.isArray(keys)) {
		return { tables: [], columns: [] };
	}

	return keys.reduce(
		(result, key) => {
			if (!key.tableName) {
				result.columns.push({
					statement: getKeyWithAlias({ key }),
					isActivated: key.isActivated,
				});

				return result;
			}

			const tableName = getNamePrefixedWithSchemaName({
				name: key.tableName,
				schemaName: key.dbName,
			});

			const addedTable = result.tables.find(table => table.statement === tableName);

			if (addedTable) {
				addedTable.isActivated = addedTable.isActivated || key.isActivated !== false;
			} else {
				result.tables.push({
					statement: tableName,
					isActivated: key.isActivated !== false,
				});
			}

			result.columns.push({
				statement: `${tableName}.${getKeyWithAlias({ key })}`,
				isActivated: key.isActivated,
			});

			return result;
		},
		{
			tables: [],
			columns: [],
		},
	);
};

module.exports = {
	getViewData,
};
