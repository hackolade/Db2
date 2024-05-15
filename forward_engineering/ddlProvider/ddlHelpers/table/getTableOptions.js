const { toUpper } = require('lodash');
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
		{
			key: 'auxiliaryBaseTable',
			getValue: getBasicValue({ prefix: 'STORES' }),
		},
		{
			key: 'auxiliaryAppend',
			getValue: getBasicValue({ prefix: 'APPEND', modifier: toUpper }),
		},
		{
			key: 'auxiliaryBaseColumn',
			getValue: getBasicValue({ prefix: 'COLUMN', modifier: name => wrapInQuotes({ name }) }),
		},
		{
			key: 'auxiliaryPart',
			getValue: getBasicValue({ prefix: 'PART' }),
		},
	];

	return getOptionsByConfigs({ configs, data: tableData });
};

module.exports = {
	getTableOptions,
};
