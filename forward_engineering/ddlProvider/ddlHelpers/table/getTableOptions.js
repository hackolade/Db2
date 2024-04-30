const { wrapInQuotes } = require('../../../utils/general');
const { getOptionsByConfigs, getBasicValue } = require('../options/getOptionsByConfigs');

/**
 * @param {object} tableData
 * @returns {string}
 */
const getTableOptions = tableData => {
	/**
	 * @type {Array}
	 */
	const configs = [
		{
			key: 'selectStatement',
			getValue: getBasicValue({ prefix: 'AS' }),
		},
		{
			key: 'underSuperTable',
			getValue: getBasicValue({
				prefix: 'UNDER',
				postfix: 'INHERIT SELECT PRIVILEGES',
				modifier: name => wrapInQuotes({ name }),
			}),
		},
		{
			key: 'tableProperties',
			getValue: value => value,
		},
		{
			key: 'table_tablespace_name',
			getValue: getBasicValue({ prefix: 'IN' }),
		},
	];

	return getOptionsByConfigs({ configs, data: tableData });
};

module.exports = {
	getTableOptions,
};
