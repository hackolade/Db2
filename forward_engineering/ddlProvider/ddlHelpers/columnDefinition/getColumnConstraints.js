const { getOptionsString } = require('../constraint/getOptionsString');

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

module.exports = {
	getColumnConstraints,
};
