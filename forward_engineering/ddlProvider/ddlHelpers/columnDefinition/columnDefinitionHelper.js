const _ = require('lodash');
const { commentIfDeactivated } = require('../../../utils/general');
const { getOptionsString } = require('../constraint/getOptionsString');
const { getColumnCommentStatement } = require('../comment/commentHelper');

/**
 * @param {{ tableName: string, columnDefinitions: object[] }}
 * @returns
 */
const getColumnComments = ({ tableName, columnDefinitions }) => {
	return _.chain(columnDefinitions)
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

const getColumnConstraints = ({ nullable, unique, primaryKey, primaryKeyOptions, uniqueKeyOptions }) => {
	const { constraintString, statement } = getOptionsString(
		getOptions({ primaryKey, unique, primaryKeyOptions, uniqueKeyOptions }),
	);
	const primaryKeyString = primaryKey ? ` PRIMARY KEY` : '';
	const uniqueKeyString = unique ? ` UNIQUE` : '';
	const nullableString = nullable ? '' : ' NOT NULL';
	return `${nullableString}${constraintString}${primaryKeyString}${uniqueKeyString}${statement}`;
};

const getOptions = ({ primaryKey, unique, primaryKeyOptions, uniqueKeyOptions }) => {
	if (primaryKey) {
		return primaryKeyOptions || {};
	} else if (unique) {
		return uniqueKeyOptions || {};
	} else {
		return {};
	}
};

const getColumnDefault = ({ default: defaultValue, identity }) => {
	if (!_.isEmpty(identity) && identity.generated) {
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

		return ` GENERATED${getGenerated(identity)} AS IDENTITY (${_.trim(getOptions(identity))})`;
	} else if (defaultValue) {
		return ` DEFAULT ${defaultValue}`;
	}
	return '';
};

const getColumnEncrypt = ({ encryption }) => {
	if (_.isPlainObject(encryption) && !_.isEmpty(_.omit(encryption, 'id'))) {
		const { ENCRYPTION_ALGORITHM, INTEGRITY_ALGORITHM, noSalt } = encryption;
		return ` ENCRYPT${ENCRYPTION_ALGORITHM ? ` USING '${ENCRYPTION_ALGORITHM}'` : ''}${INTEGRITY_ALGORITHM ? ` '${INTEGRITY_ALGORITHM}'` : ''}${noSalt ? ' NO SALT' : ''}`;
	}
	return '';
};

const addByteLength = (type, length, lengthSemantics) => {
	return ` ${type}(${length} ${_.toUpper(lengthSemantics)})`;
};

const addLength = (type, length) => {
	return ` ${type}(${length})`;
};

const addScalePrecision = (type, precision, scale) => {
	if (_.isNumber(scale)) {
		return ` ${type}(${precision ? precision : '*'},${scale})`;
	} else if (_.isNumber(precision)) {
		return ` ${type}(${precision})`;
	} else {
		return ` ${type}`;
	}
};

const addPrecision = (type, precision) => {
	if (_.isNumber(precision)) {
		return ` ${type}(${precision})`;
	}
	return ` ${type}`;
};

const timestamp = (fractSecPrecision, withTimeZone, localTimeZone) => {
	return ` TIMESTAMP${_.isNumber(fractSecPrecision) ? `(${fractSecPrecision})` : ''}${withTimeZone ? ` WITH${localTimeZone ? ' LOCAL' : ''} TIME ZONE` : ''}`;
};

const getMultisetType = itemsType => {
	return ` MULTISET` + (itemsType ? `(${itemsType})` : '');
};

const canHaveByte = type => ['CHAR', 'VARCHAR', 'CLOB', 'DBCLOB', 'NCLOB', 'BLOB'].includes(type);
const canHaveLength = type =>
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
const canHavePrecision = type => ['DECIMAL', 'FLOAT', 'DECFLOAT'].includes(type);
const canHaveScale = type => type === 'DECIMAL';
const isTimezone = type => type === 'TIMESTAMP';
const isMultiset = type => type === 'MULTISET';

const decorateType = columnDefinition => {
	const type = columnDefinition.type;

	switch (true) {
		case columnDefinition.lengthSemantics &&
			canHaveByte(type) &&
			canHaveLength(type) &&
			_.isNumber(columnDefinition.length):
			return addByteLength(type, columnDefinition.length, columnDefinition.lengthSemantics);
		case canHaveLength(type) && _.isNumber(columnDefinition.length):
			return addLength(type, columnDefinition.length);
		case canHavePrecision(type) && canHaveScale(type):
			return addScalePrecision(type, columnDefinition.precision, columnDefinition.scale);
		case canHavePrecision(type) && _.isNumber(columnDefinition.precision):
			return addPrecision(type, columnDefinition.precision);
		case isTimezone(type):
			return timestamp(
				columnDefinition.fractSecPrecision,
				columnDefinition.withTimeZone,
				columnDefinition.localTimeZone,
			);
		case isMultiset(type):
			return getMultisetType(columnDefinition.itemsType);
		case !!(columnDefinition.isUDTRef && columnDefinition.schemaName):
			return ` "${columnDefinition.schemaName}"."${type}"`;
		default:
			return ` ${type}`;
	}
};

/**
 *
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
