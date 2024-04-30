const { trim, identity } = require('lodash');

/**
 * @template T
 * @param {{ prefix?: string, postfix?: string, modifier?: (value: T) => T }}
 * @returns {(value: T) => string}
 */
const getBasicValue = ({ prefix = '', postfix = '', modifier = identity }) => {
	return value => (value ? [prefix, modifier(value), postfix].filter(Boolean).map(trim).join(' ') : '');
};

/**
 * @typedef {{ key: string, getValue: (key: string, data: object) => string }} Config
 * @param {{ configs: Config[], data: object }}
 * @returns {string}
 */
const getOptionsByConfigs = ({ configs, data }) => {
	const statements = configs
		.filter(({ key }) => data[key])
		.map(({ key, getValue }) => getValue(data[key], data))
		.filter(Boolean)
		.join('\n\t');

	return getBasicValue({ prefix: ' ' })(statements);
};

module.exports = {
	getBasicValue,
	getOptionsByConfigs,
};
