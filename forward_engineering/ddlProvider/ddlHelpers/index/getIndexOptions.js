const { toUpper } = require('lodash');
const { getBasicValue, getOptionsByConfigs } = require('../options/getOptionsByConfigs');
const { wrapInQuotes, checkAllKeysDeactivated, commentIfDeactivated } = require('../../../utils/general');

const getIndexKeyStatement = ({ name, type }) => {
	const keyType = getBasicValue({ prefix: ' ', modifier: toUpper })(type);

	return wrapInQuotes(name) + keyType;
};

/**
 * @param {object[]} keys
 * @param {object} [index]
 * @returns {string}
 */
const getIndexKeys = (keys = [], index = {}) => {
	if (!keys.length) {
		return '';
	}

	const isWholeIndexCommented =
		index.isActivated === false ||
		index.isParentActivated === false ||
		checkAllKeysDeactivated({ keys: index.indxKey || keys });
	const keysClause = keys
		.map(key => {
			const statement = getIndexKeyStatement(key);

			if (isWholeIndexCommented) {
				return statement;
			}

			return commentIfDeactivated(statement, { isActivated: key.isActivated !== false, isPartOfLine: true });
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

	const includeIndexKeys = getIndexKeys(keys, index);

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
