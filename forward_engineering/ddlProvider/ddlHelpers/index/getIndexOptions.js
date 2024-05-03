const { toUpper } = require('lodash');
const { getBasicValue, getOptionsByConfigs } = require('../options/getOptionsByConfigs');
const { wrapInQuotes } = require('../../../utils/general');

/**
 * @param {object[]} keys
 * @returns {string}
 */
const getIndexKeys = (keys = []) => {
	if (!keys.length) {
		return '';
	}

	const keysClause = keys
		.map(({ name, type }) => {
			const keyType = getBasicValue({ prefix: ' ', modifier: toUpper })(type);
			const keyName = wrapInQuotes({ name });

			return keyName + keyType;
		})
		.join(', ');

	return `(${keysClause})`;
};

/**
 * @param {object[] | undefined} keys
 * @param {object} index
 * @returns {string}
 */
const getIncludeIndexKeys = (keys, index) => {
	if (index.indxType !== 'unique') {
		return '';
	}

	const includeIndexKeys = getIndexKeys(keys);

	return getBasicValue({ prefix: 'INCLUDE' })(includeIndexKeys);
};

/**
 * @param {{ index: object }}
 * @returns {string}
 */
const getIndexOptions = ({ index }) => {
	const configs = [
		{ key: 'indxKey', getValue: getIndexKeys },
		{ key: 'indxIncludeKey', getValue: getIncludeIndexKeys },
		{ key: 'indxCompress', getValue: getBasicValue({ prefix: 'COMPRESS', modifier: toUpper }) },
		{ key: 'indxNullKeys', getValue: getBasicValue({ postfix: 'NULL KEYS', modifier: toUpper }) },
		{ key: 'indxTablespace', getValue: getBasicValue({ prefix: 'IN' }) },
	];

	return getOptionsByConfigs({ configs, data: index });
};

module.exports = {
	getIndexOptions,
};
