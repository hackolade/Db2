const { INLINE_COMMENT } = require('../../constants/constants');

/**
 * @typedef {{ statement: string; isActivated: boolean; }} StatementDto
 */

/**
 * @param {{
 * index: number;
 * numberOfStatements: number;
 * lastIndexOfActivatedStatement: number;
 * delimiter: string;
 * }}
 * @return {string}
 * */
const getDelimiter = ({ index, numberOfStatements, lastIndexOfActivatedStatement, delimiter }) => {
	const isLastStatement = index === numberOfStatements - 1;
	const isLastActivatedStatement = index === lastIndexOfActivatedStatement;

	if (isLastStatement || isLastActivatedStatement) {
		return '';
	}

	return delimiter;
};

/**
 * @param {{
 * statementDtos: StatementDto[];
 * delimiter?: string;
 * indent?: string;
 * }}
 * @return {string}
 * */
const joinActivatedAndDeactivatedStatements = ({ statementDtos, delimiter = ',', indent = '\n' }) => {
	const lastIndexOfActivatedStatement = statementDtos.findLastIndex(({ isActivated }) => isActivated);
	const numberOfStatements = statementDtos.length;

	return statementDtos
		.map(({ statement }, index) => {
			const currentDelimiter = getDelimiter({
				index,
				numberOfStatements,
				lastIndexOfActivatedStatement,
				delimiter,
			});

			return statement + currentDelimiter;
		})
		.join(indent);
};

/**
 * @param {{ columns?: string[] }}
 * @returns {string}
 */
const joinActivatedAndDeactivatedColumnStatements = ({ columns = [] }) => {
	const statementDtos = columns.map(column => {
		return {
			statement: column,
			isActivated: !column.startsWith(INLINE_COMMENT),
		};
	});

	return joinActivatedAndDeactivatedStatements({ statementDtos, delimiter: ',', indent: '\n\t' });
};

module.exports = {
	joinActivatedAndDeactivatedStatements,
	joinActivatedAndDeactivatedColumnStatements,
};
