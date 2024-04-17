const { wrapInQuotes } = require('../../../utils/general');

const wrap = value => (value ? `${value}\n` : '');

const getTableOptions = tableData => {
	/**
	 * @type {Array}
	 */
	const optionConfigs = [
		{ key: 'selectStatement', getValue: getBasicValue('AS') },
		{ key: 'underSuperTable', getValue: getUnderClause },
		{ key: 'tableProperties', getValue: value => value },
		{ key: 'table_tablespace_name', getValue: getBasicValue('IN') },
	];

	const statements = optionConfigs
		.filter(config => tableData[config.key])
		.map(config => wrap(config.getValue(tableData[config.key], tableData)))
		.join('');

	return statements ? ` ${statements}`.replace(/\n$/, '') : '';
};

const getBasicValue = prefix => value => {
	if (!value) {
		return '';
	}

	return `${prefix} ${value}`;
};

const getUnderClause = value => {
	if (!value) {
		return '';
	}

	return 'UNDER ' + wrapInQuotes({ name: value }) + ' INHERIT SELECT PRIVILEGES';
};

module.exports = {
	getTableOptions,
};
