const { isNumber, toUpper } = require('lodash');
const {
	DATA_TYPES_WITH_BYTE,
	DATA_TYPES_WITH_LENGTH,
	DATA_TYPES_WITH_PRECISION,
	DATA_TYPE,
} = require('../../../../constants/types');

/**
 * @param {{ type: string, length: number, lengthSemantics: string }}
 * @returns {string}
 */
const addByteLength = ({ type, length, lengthSemantics }) => {
	return ` ${type}(${length} ${toUpper(lengthSemantics)})`;
};

/**
 * @param {{ type: string, length: number }}
 * @returns {string}
 */
const addLength = ({ type, length }) => {
	return ` ${type}(${length})`;
};

/**
 * @param {{ type: string, precision: number, scale: number }}
 * @returns {string}
 */
const addScalePrecision = ({ type, precision, scale }) => {
	if (isNumber(scale)) {
		return ` ${type}(${precision ? precision : '*'},${scale})`;
	}

	if (isNumber(precision)) {
		return ` ${type}(${precision})`;
	}

	return ` ${type}`;
};

/**
 * @param {{ type: string, precision: number }}
 * @returns {string}
 */
const addPrecision = ({ type, precision }) => {
	if (isNumber(precision)) {
		return ` ${type}(${precision})`;
	}
	return ` ${type}`;
};
/**
 * @param {{ fractSecPrecision: number, withTimeZone: boolean, localTimeZone: boolean }}
 * @returns {string}
 */
const getTimestampType = ({ fractSecPrecision, withTimeZone, localTimeZone }) => {
	return ` TIMESTAMP${isNumber(fractSecPrecision) ? `(${fractSecPrecision})` : ''}${withTimeZone ? ` WITH${localTimeZone ? ' LOCAL' : ''} TIME ZONE` : ''}`;
};

/**
 * @param {{ itemsType: string }}
 * @returns {string}
 */
const getMultisetType = ({ itemsType }) => {
	return ` MULTISET` + (itemsType ? `(${itemsType})` : '');
};

const canHaveByte = ({ type }) => DATA_TYPES_WITH_BYTE.includes(type);

const canHaveLength = ({ type }) => DATA_TYPES_WITH_LENGTH.includes(type);

const canHavePrecision = ({ type }) => DATA_TYPES_WITH_PRECISION.includes(type);

const canHaveScale = ({ type }) => type === DATA_TYPE.decimal;

const isTimestamp = ({ type }) => type === DATA_TYPE.timestamp;

const isMultiset = ({ type }) => type === DATA_TYPE.multiset;

const decorateColumnType = ({
	type,
	length,
	lengthSemantics,
	precision,
	scale,
	fractSecPrecision,
	withTimeZone,
	localTimeZone,
	itemsType,
	isUDTRef,
	schemaName,
}) => {
	const hasLength = isNumber(length);

	switch (true) {
		case hasLength && lengthSemantics && canHaveByte({ type }) && canHaveLength({ type }):
			return addByteLength({ type, length, lengthSemantics });
		case hasLength && canHaveLength({ type }):
			return addLength({ type, length });
		case canHavePrecision({ type }) && canHaveScale({ type }):
			return addScalePrecision({ type, precision, scale });
		case canHavePrecision({ type }) && isNumber(precision):
			return addPrecision({ type, precision });
		case isTimestamp({ type }):
			return getTimestampType({ fractSecPrecision, withTimeZone, localTimeZone });
		case isMultiset({ type }):
			return getMultisetType({ itemsType });
		case !!(isUDTRef && schemaName):
			return ` "${schemaName}"."${type}"`;
		default:
			return ` ${type}`;
	}
};

module.exports = {
	decorateColumnType,
};
