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

const getDropCheckConstraintScriptDtos = (constraintHistory, fullTableName, isActivated) => {
	return constraintHistory
		.filter(historyEntry => historyEntry.old?.constrExpression && !historyEntry.new?.constrExpression)
		.map(historyEntry => {
			const wrappedConstraintName = wrapInQuotes(historyEntry.old.chkConstrName);
			return dropConstraint(fullTableName, wrappedConstraintName);
		})
		.map(script => AlterScriptDto.getInstance([script], isActivated, true));
};

const getAddCheckConstraintScriptDtos = (constraintHistory, fullTableName, isActivated) => {
	return constraintHistory
		.filter(historyEntry => historyEntry.new?.constrExpression && !historyEntry.old?.constrExpression)
		.map(historyEntry => {
			const { chkConstrName, constrExpression } = historyEntry.new;
			return addCheckConstraint(fullTableName, wrapInQuotes(chkConstrName), constrExpression);
		})
		.map(script => AlterScriptDto.getInstance([script], isActivated, false));
};

const getUpdateCheckConstraintScriptDtos = (constraintHistory, fullTableName, isActivated) => {
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
				AlterScriptDto.getInstance([dropConstraintScript], isActivated, true),
				AlterScriptDto.getInstance([addConstraintScript], isActivated, false),
			];
		});
};

const getModifyCheckConstraintScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const constraintHistory = mapCheckConstraintNamesToChangeHistory(collection);
	const isActivated =
		isParentContainerActivated(collection) !== false && isObjectInDeltaModelActivated(collection) !== false;

	const addCheckConstraintScripts = getAddCheckConstraintScriptDtos(constraintHistory, fullTableName, isActivated);
	const dropCheckConstraintScripts = getDropCheckConstraintScriptDtos(constraintHistory, fullTableName, isActivated);
	const updateCheckConstraintScripts = getUpdateCheckConstraintScriptDtos(
		constraintHistory,
		fullTableName,
		isActivated,
	);

	return [...addCheckConstraintScripts, ...dropCheckConstraintScripts, ...updateCheckConstraintScripts];
};

module.exports = {
	getModifyCheckConstraintScriptDtos,
};
