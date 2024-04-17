const { wrapInQuotes } = require('../../../utils/general');

/**
 * @param {{ key?: object }}
 * @returns {string}
 */
const getKeyWithAlias = ({ key }) => {
	if (!key) {
		return '';
	}

	if (key.alias) {
		return `${wrapInQuotes({ name: key.name })} as ${wrapInQuotes({ name: key.alias })}`;
	} else {
		return wrapInQuotes({ name: key.name });
	}
};

/**
 * @typedef {{ statement: string, isActivated: boolean }} Column
 * @param {{ keys?: object[] }}
 * @returns {{ tables: string[], columns: Column[] }}
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

			const tableName = `${wrapInQuotes({ name: key.dbName })}.${wrapInQuotes({ name: key.tableName })}`;

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
