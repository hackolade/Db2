const _ = require('lodash');
const {
	commentIfDeactivated,
	checkAllKeysDeactivated,
	getColumnsList,
	wrapInQuotes,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../templates');

const getKeyOptions = (keyData, isParentActivated) => {
	const constraintName = wrapInQuotes(keyData.name.trim());
	const isAllColumnsDeactivated = checkAllKeysDeactivated(keyData.columns || []);
	const columns = _.isEmpty(keyData.columns)
		? ''
		: getColumnsList(keyData.columns, isAllColumnsDeactivated, isParentActivated);

	const { deferClause, rely, indexClause, validate, exceptionClause } = keyData.options || {};
	const options = [deferClause, rely, indexClause, validate, exceptionClause]
		.filter(Boolean)
		.map(option => ` ${option}`)
		.join('');

	return {
		constraintName,
		columns,
		options,
		isActivated: !isAllColumnsDeactivated && isParentActivated,
	};
};

const alterPkConstraint = (tableName, isParentActivated, keyData) => {
	const { isActivated, ...templateData } = getKeyOptions(keyData, isParentActivated);

	return {
		statement: assignTemplates({
			template: templates.alterPkConstraint,
			templateData: {
				tableName,
				...templateData,
			},
		}),
		isActivated,
	};
};

const dropPK = tableName => {
	const templateData = { tableName };
	return assignTemplates({
		template: templates.dropPK,
		templateData,
	});
};

const alterUkConstraint = (tableName, isParentActivated, keyData) => {
	const { isActivated, ...templateData } = getKeyOptions(keyData, isParentActivated);

	return {
		statement: assignTemplates({
			template: templates.alterUkConstraint,
			templateData: {
				tableName,
				...templateData,
			},
		}),
		isActivated,
	};
};

/**
 * @param tableName {string}
 * @param constraintName {string}
 * */
const dropUkConstraint = (tableName, constraintName) => {
	const templateData = {
		tableName,
		constraintName,
	};
	return assignTemplates({
		template: templates.dropUkConstraint,
		templateData,
	});
};

module.exports = {
	alterPkConstraint,
	dropPK,
	alterUkConstraint,
	dropUkConstraint,
};
