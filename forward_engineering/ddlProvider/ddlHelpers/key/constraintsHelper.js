const _ = require('lodash');
const {
	commentIfDeactivated,
	checkAllKeysDeactivated,
	getColumnsList,
	wrapInQuotes,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../templates');

const alterPkConstraint = (tableName, isParentActivated, keyData) => {
	const constraintName = wrapInQuotes({ name: keyData.name.trim() });
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
		statement: assignTemplates({
			template: templates.alterPkConstraint,
			templateData: {
				tableName,
				constraintName,
				columns,
				options,
			},
		}),
		isActivated: !isAllColumnsDeactivated && isParentActivated,
	};
};

const dropPK = tableName => {
	const templatesConfig = { tableName };
	return assignTemplates(templates.dropPK, templatesConfig);
};

module.exports = {
	alterPkConstraint,
	dropPK,
};
