const { wrapInQuotes } = require('../../../utils/general');

/**
 * @param {{ key?: object }} param0
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
 * @param {{ keys?: object[] }}
 * @returns {{ tables: string[], columns: string[] }}
 */
const getViewData = ({ keys }) => {
	if (!Array.isArray(keys)) {
		return { tables: [], columns: [] };
	}

	return keys.reduce(
		(result, key) => {
			if (!key.tableName) {
				result.columns.push(getKeyWithAlias({ key }));

				return result;
			}

			const tableName = `${wrapInQuotes(key.dbName)}.${wrapInQuotes(key.tableName)}`;

			if (!result.tables.includes(tableName)) {
				result.tables.push(tableName);
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
