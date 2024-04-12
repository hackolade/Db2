const templates = require('../../templates');
const { assignTemplates } = require('../../../utils/assignTemplates');
const {
	getColumnsList,
	checkAllKeysDeactivated,
	commentIfDeactivated,
	wrapInQuotes,
	divideIntoActivatedAndDeactivated,
} = require('../../../utils/general');
const { getOptionsString } = require('../constraintHelper');

/**
 * @typedef {{ activatedItems: string[], deactivatedItems: string[] }} DividedConstraints
 */

/**
 * @param {object} key
 * @returns {string}
 */
const getKeyStatement = key => key.statement;

/**
 * @param {{statements?: string[]}} statements
 * @returns {string}
 */
const joinStatements = ({ statements }) => {
	if (!Array.isArray(statements) || !statements.length) {
		return '';
	}

	return statements.join(',\n\t');
};

/**
 * @param {{ dividedConstraints: DividedConstraints, isParentActivated: boolean }}
 * @returns {string}
 */
const generateConstraintsString = ({ dividedConstraints, isParentActivated }) => {
	const { activatedItems, deactivatedItems } = dividedConstraints;
	const deactivatedItemsAsString = commentIfDeactivated(deactivatedItems.join(',\n\t'), {
		isActivated: !isParentActivated,
		isPartOfLine: true,
	});
	const activatedConstraints = activatedItems.length ? ',\n\t' + dividedConstraints.activatedItems.join(',\n\t') : '';

	const deactivatedConstraints = deactivatedItems.length ? '\n\t' + deactivatedItemsAsString : '';

	return activatedConstraints + deactivatedConstraints;
};

/**
 * @param {{ keyData: object, isParentActivated: boolean }}
 * @returns {string}
 */
const createKeyConstraint = ({ keyData, isParentActivated }) => {
	const isAllColumnsDeactivated = checkAllKeysDeactivated(keyData.columns);
	const columns = getColumnsList(keyData.columns, isAllColumnsDeactivated, isParentActivated);
	const options = getOptionsString(keyData).statement;

	return {
		statement: assignTemplates(templates.createKeyConstraint, {
			constraintName: keyData.constraintName ? `CONSTRAINT ${wrapInQuotes(keyData.constraintName)} ` : '',
			keyType: keyData.keyType,
			columns,
			options,
		}),
		isActivated: !isAllColumnsDeactivated,
	};
};

/**
 * @param {{ keyConstraints: object[], isActivated: boolean }}
 * @returns {DividedConstraints}
 */
const getDividedKeysConstraints = ({ keyConstraints, isActivated }) => {
	const keys = keyConstraints.map(keyData => createKeyConstraint({ keyData, isParentActivated: isActivated }));

	return divideIntoActivatedAndDeactivated({ items: keys, mapFunction: getKeyStatement });
};

/**
 * @param {{ foreignKeyConstraints: object[] }}
 * @returns {DividedConstraints}
 */
const getDividedForeignKeyConstraints = ({ foreignKeyConstraints }) => {
	return divideIntoActivatedAndDeactivated({ items: foreignKeyConstraints, mapFunction: getKeyStatement });
};

/**
 * @param {{
 * columns: string[],
 * foreignKeyConstraints: object[],
 * keyConstraints: object[],
 * checkConstraints: object[],
 * isActivated: boolean }}
 *
 * @returns {string}
 */
const getTableProps = ({ columns, foreignKeyConstraints, keyConstraints, checkConstraints, isActivated }) => {
	const dividedKeysConstraints = getDividedKeysConstraints({ keyConstraints, isActivated });
	const dividedForeignKeyConstraints = getDividedForeignKeyConstraints({ foreignKeyConstraints });
	const keyConstraintsString = generateConstraintsString({
		dividedConstraints: dividedKeysConstraints,
		isParentActivated: isActivated,
	});
	const foreignKeyConstraintsString = generateConstraintsString({
		dividedConstraints: dividedForeignKeyConstraints,
		isParentActivated: isActivated,
	});
	const columnsString = joinStatements({ statements: columns });
	const checkConstraintsString = joinStatements({ statements: checkConstraints });
	const tableProps = assignTemplates(templates.createTableProps, {
		columns: columnsString,
		foreignKeyConstraints: foreignKeyConstraintsString,
		keyConstraints: keyConstraintsString,
		checkConstraints: checkConstraintsString,
	});

	return tableProps ? `\n(\n\t${tableProps}\n)` : '';
};

module.exports = {
	getTableProps,
};
