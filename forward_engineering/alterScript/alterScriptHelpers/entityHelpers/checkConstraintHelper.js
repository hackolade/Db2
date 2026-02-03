const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getFullCollectionName,
	wrapInQuotes,
	isParentContainerActivated,
	isObjectInDeltaModelActivated,
	getSchemaOfAlterCollection,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');

const addCheckConstraint = (tableName, constraintName, expression) => {
	return assignTemplates({
		template: templates.alterCheckConstraint,
		templateData: {
			tableName,
			constraintName,
			expression,
		},
	});
};

const dropConstraint = (tableName, constraintName) => {
	return assignTemplates({
		template: templates.dropCheckConstraint,
		templateData: {
			tableName,
			constraintName,
		},
	});
};

const mapCheckConstraintNamesToChangeHistory = collection => {
	const checkConstraintHistory = collection?.compMod?.chkConstr;
	if (!checkConstraintHistory) {
		return [];
	}
	const newConstraints = checkConstraintHistory.new || [];
	const oldConstraints = checkConstraintHistory.old || [];
	const constrNames = _.chain([...newConstraints, ...oldConstraints])
		.map(constr => constr.chkConstrName)
		.uniq()
		.value();

	return constrNames.map(chkConstrName => {
		return {
			old: _.find(oldConstraints, { chkConstrName }),
			new: _.find(newConstraints, { chkConstrName }),
		};
	});
};

const getDropCheckConstraintScriptDtos = (constraintHistory, fullTableName) => {
	return constraintHistory
		.filter(historyEntry => historyEntry.old?.constrExpression && !historyEntry.new?.constrExpression)
		.map(historyEntry => {
			const wrappedConstraintName = wrapInQuotes(historyEntry.old.chkConstrName);
			return dropConstraint(fullTableName, wrappedConstraintName);
		})
		.map(script => AlterScriptDto.getInstance([script], true, true));
};

const getAddCheckConstraintScriptDtos = (constraintHistory, fullTableName) => {
	return constraintHistory
		.filter(historyEntry => historyEntry.new?.constrExpression && !historyEntry.old?.constrExpression)
		.map(historyEntry => {
			const { chkConstrName, constrExpression } = historyEntry.new;
			return addCheckConstraint(fullTableName, wrapInQuotes(chkConstrName), constrExpression);
		})
		.map(script => AlterScriptDto.getInstance([script], true, false));
};

const getUpdateCheckConstraintScriptDtos = (constraintHistory, fullTableName) => {
	return constraintHistory
		.filter(historyEntry => {
			if (historyEntry.old?.constrExpression && historyEntry.new?.constrExpression) {
				const oldExpression = historyEntry.old.constrExpression;
				const newExpression = historyEntry.new.constrExpression;
				return oldExpression !== newExpression;
			}
			return false;
		})
		.flatMap(historyEntry => {
			const { chkConstrName: oldConstrainName } = historyEntry.old;
			const dropConstraintScript = dropConstraint(fullTableName, wrapInQuotes(oldConstrainName));

			const { chkConstrName: newConstrainName, constrExpression: newConstraintExpression } = historyEntry.new;
			const addConstraintScript = addCheckConstraint(
				fullTableName,
				wrapInQuotes(newConstrainName),
				newConstraintExpression,
			);

			return [
				AlterScriptDto.getInstance([dropConstraintScript], true, true),
				AlterScriptDto.getInstance([addConstraintScript], true, false),
			];
		});
};

const getModifyCheckConstraintScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const constraintHistory = mapCheckConstraintNamesToChangeHistory(collection);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);

	const addCheckConstraintScripts = getAddCheckConstraintScriptDtos(constraintHistory, fullTableName);
	const dropCheckConstraintScripts = getDropCheckConstraintScriptDtos(constraintHistory, fullTableName);
	const updateCheckConstraintScripts = getUpdateCheckConstraintScriptDtos(constraintHistory, fullTableName);

	return [...addCheckConstraintScripts, ...dropCheckConstraintScripts, ...updateCheckConstraintScripts].map(dto => ({
		...dto,
		isActivated: isContainerActivated && isCollectionActivated,
	}));
};

module.exports = {
	getModifyCheckConstraintScriptDtos,
};
