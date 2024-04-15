const { wrapInQuotes } = require('../../../utils/general');

const getOptionsString = ({ constraintName, deferClause, rely, validate, indexClause, exceptionClause }) => ({
	constraintString: `${constraintName ? ` CONSTRAINT ${wrapInQuotes(constraintName.trim())}` : ''}`,
	statement: `${deferClause ? ` ${deferClause}` : ''}${rely ? ` ${rely}` : ''}${
		indexClause ? ` ${indexClause}` : ''
	}${validate ? ` ${validate}` : ''}${exceptionClause ? ` ${exceptionClause}` : ''}`,
});

module.exports = {
	getOptionsString,
};
