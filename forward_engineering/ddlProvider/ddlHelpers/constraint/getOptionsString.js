const { wrapInQuotes } = require('../../../utils/general');

/**
 * @param {{
 * constraintName?: string,
 * deferClause?: string,
 * rely?: string,
 * validate?: string,
 * indexClause?: string,
 * exceptionClause?: string
 * }}
 * @returns {string}
 */
const getOptionsString = ({ constraintName, deferClause, rely, validate, indexClause, exceptionClause }) => {
	const constraintString = constraintName ? ` CONSTRAINT ${wrapInQuotes(constraintName.trim())}` : '';
	const statement = [deferClause, rely, indexClause, validate, exceptionClause]
		.filter(Boolean)
		.map(option => ` ${option}`)
		.join('');

	return {
		constraintString,
		statement,
	};
};

module.exports = {
	getOptionsString,
};
