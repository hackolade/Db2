const { chain, isEmpty, isNumber, isPlainObject, omit, trim, toUpper } = require('lodash');
const { commentIfDeactivated, wrapInQuotes } = require('../../../utils/general');
const { getOptionsString } = require('../constraint/getOptionsString');
const { getColumnCommentStatement } = require('../comment/commentHelper');
const { INTEGER_DATA_TYPES } = require('../../../../constants/types');

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
 * @param {string} type
 * @returns {boolean}
 */
const canHaveIdentity = type => {
	return INTEGER_DATA_TYPES.includes(toUpper(type));
};

module.exports = {
	getColumnComments,
	getColumnConstraints,
	getColumnDefault,
	getColumnEncrypt,
	canHaveIdentity,
};
