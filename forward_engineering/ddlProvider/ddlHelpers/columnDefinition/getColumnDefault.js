const { toUpper } = require('lodash');
const { wrapInQuotes } = require('../../../utils/general');
const { DATA_TYPES_WITH_IDENTITY } = require('../../../../constants/types');

/**
 * @typedef {string | number} DefaultValue
 */

/**
 * @param {{ type: string }}
 * @returns {boolean}
 */
const canHaveIdentity = ({ type }) => {
	return DATA_TYPES_WITH_IDENTITY.includes(toUpper(type));
};

/**
 * @param {{ identity?: object, type: string }}
 * @returns {boolean}
 */
const isGeneratedAsIdentity = ({ identity, type }) => {
	return canHaveIdentity({ type }) && !!identity?.generated;
};

/**
 * @param {{ start?: number, increment?: number, minValue?: number, maxValue?: number, cycle?: string }} param0
 * @returns {string}
 */
const getIdentityOptions = ({ start, increment, minValue, maxValue, cycle }) => {
	const startWith = start ? `START WITH ${start}` : '';
	const incrementBy = increment ? `INCREMENT BY ${increment}` : '';
	const minimumValue = minValue ? `MINVALUE ${minValue}` : '';
	const maximumValue = maxValue ? `MAXVALUE ${maxValue}` : '';

	return [startWith, incrementBy, cycle, minimumValue, maximumValue].filter(Boolean).join(', ');
};

/**
 * @param {{ defaultValue: DefaultValue }}
 * @returns {DefaultValue}
 */
const wrapInQuotesDefaultValue = ({ defaultValue }) => {
	const doesContainSpaces = /\s+/g.test(defaultValue);

	return doesContainSpaces ? wrapInQuotes({ name: defaultValue }) : defaultValue;
};

/**
 * @param {{ default?: DefaultValue, identity?: object }}
 * @returns {string}
 */
const getColumnDefault = ({ default: defaultValue, identity, type }) => {
	const isGeneratedIdentity = isGeneratedAsIdentity({ identity, type });

	if (isGeneratedIdentity) {
		const identityOptions = getIdentityOptions(identity);

		return ` GENERATED ${identity.generated} AS IDENTITY (${identityOptions})`;
	}

	if (defaultValue || defaultValue === 0) {
		const value = wrapInQuotesDefaultValue({ defaultValue });

		return ` WITH DEFAULT ${value}`;
	}
	return '';
};

module.exports = {
	getColumnDefault,
};
