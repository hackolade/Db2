const { chain, isEmpty, isNumber, isPlainObject, omit, trim, toUpper } = require('lodash');
const { commentIfDeactivated, wrapInQuotes } = require('../../../utils/general');
const { getOptionsString } = require('../constraint/getOptionsString');
const { getColumnCommentStatement } = require('../comment/commentHelper');

/**
 * @param {{ tableName: string, columnDefinitions: object[] }}
 * @returns {string}
 */
const getColumnComments = ({ tableName, columnDefinitions }) => {
	return chain(columnDefinitions)
		.filter('comment')
		.map(columnData => {
			const comment = getColumnCommentStatement({
				tableName,
				columnName: columnData.name,
				description: columnData.comment,
			});

			return commentIfDeactivated(comment, columnData);
		})
		.join('\n')
		.value();
};

/**
 * @param {{
 * nullable: boolean,
 * unique: boolean,
 * primaryKey: boolean,
 * primaryKeyOptions?: object,
 * uniqueKeyOptions?: object
 * }}
 * @returns {string}
 */
const getColumnConstraints = ({ nullable, unique, primaryKey, primaryKeyOptions, uniqueKeyOptions }) => {
	const { constraintString, statement } = getOptionsString(
		getOptions({ primaryKey, unique, primaryKeyOptions, uniqueKeyOptions }),
	);
	const primaryKeyString = primaryKey ? ` PRIMARY KEY` : '';
	const uniqueKeyString = unique ? ` UNIQUE` : '';
	const nullableString = nullable ? '' : ' NOT NULL';
	return `${nullableString}${constraintString}${primaryKeyString}${uniqueKeyString}${statement}`;
};

/**
 * @param {{ primaryKey: boolean, unique: boolean, primaryKeyOptions?: object, uniqueKeyOptions?: object}}
 * @returns {object}
 */
const getOptions = ({ primaryKey, unique, primaryKeyOptions, uniqueKeyOptions }) => {
	if (primaryKey) {
		return primaryKeyOptions || {};
	} else if (unique) {
		return uniqueKeyOptions || {};
	} else {
		return {};
	}
};

/**
 * @param {{ default: string | number | undefined, identity }}
 * @returns {string}
 */
const getColumnDefault = ({ default: defaultValue, identity }) => {
	if (!isEmpty(identity) && identity.generated) {
		const getGenerated = ({ generated, generatedOnNull }) => {
			if (generated === 'BY DEFAULT') {
				return ` ${generated} ${generatedOnNull ? ' ON NULL' : ''}`;
			} else {
				return ` ALWAYS`;
			}
		};

		const getOptions = ({ start, increment, minValue, maxValue, cycle }) => {
			const startWith = start ? `START WITH ${start}` : '';
			const incrementBy = increment ? `INCREMENT BY ${increment}` : '';
			const minimumValue = minValue ? `MINVALUE ${minValue}` : '';
			const maximumValue = maxValue ? `MAXVALUE ${maxValue}` : '';

			return [startWith, incrementBy, cycle, minimumValue, maximumValue].filter(Boolean).join(', ');
		};

		return ` GENERATED${getGenerated(identity)} AS IDENTITY (${trim(getOptions(identity))})`;
	} else if (defaultValue) {
		const value = isNumber(defaultValue) ? defaultValue : wrapInQuotes(defaultValue);

		return ` WITH DEFAULT ${value}`;
	}
	return '';
};

/**
 * @param {{ encryption }}
 * @returns {string}
 */
const getColumnEncrypt = ({ encryption }) => {
	if (isPlainObject(encryption) && !isEmpty(omit(encryption, 'id'))) {
		const { ENCRYPTION_ALGORITHM, INTEGRITY_ALGORITHM, noSalt } = encryption;
		return ` ENCRYPT${ENCRYPTION_ALGORITHM ? ` USING '${ENCRYPTION_ALGORITHM}'` : ''}${INTEGRITY_ALGORITHM ? ` '${INTEGRITY_ALGORITHM}'` : ''}${noSalt ? ' NO SALT' : ''}`;
	}
	return '';
};

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

const addPrecision = ({ type, precision }) => {
	if (isNumber(precision)) {
		return ` ${type}(${precision})`;
	}
	return ` ${type}`;
};

const getTimestampType = ({ fractSecPrecision, withTimeZone, localTimeZone }) => {
	return ` TIMESTAMP${isNumber(fractSecPrecision) ? `(${fractSecPrecision})` : ''}${withTimeZone ? ` WITH${localTimeZone ? ' LOCAL' : ''} TIME ZONE` : ''}`;
};

const getMultisetType = ({ itemsType }) => {
	return ` MULTISET` + (itemsType ? `(${itemsType})` : '');
};

const canHaveByte = ({ type }) => ['CHAR', 'VARCHAR', 'CLOB', 'DBCLOB', 'NCLOB', 'BLOB'].includes(type);
const canHaveLength = ({ type }) =>
	[
		'CHAR',
		'VARCHAR',
		'NCHAR',
		'NVARCHAR',
		'CLOB',
		'GRAPHIC',
		'VARGRAPHIC',
		'DBCLOB',
		'BINARY',
		'VARBINARY',
		'BLOB',
		'ARRAY',
	].includes(type);
const canHavePrecision = ({ type }) => ['DECIMAL', 'FLOAT', 'DECFLOAT'].includes(type);
const canHaveScale = ({ type }) => type === 'DECIMAL';
const isTimestamp = ({ type }) => type === 'TIMESTAMP';
const isMultiset = ({ type }) => type === 'MULTISET';

const decorateType = ({
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

/**
 * @param {string} type
 * @returns {boolean}
 */
const canHaveIdentity = type => {
	const typesAllowedToHaveAutoIncrement = ['smallint', 'integer', 'bigint'];
	return typesAllowedToHaveAutoIncrement.includes(type);
};

module.exports = {
	getColumnComments,
	getColumnConstraints,
	getColumnDefault,
	getColumnEncrypt,
	decorateType,
	canHaveIdentity,
};
