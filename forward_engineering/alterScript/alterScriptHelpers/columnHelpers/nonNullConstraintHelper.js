const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getFullCollectionName,
	wrapInQuotes,
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getSchemaOfAlterCollection,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');

/**
 * @param tableName {string}
 * @param columnName {string}
 * @return string
 * */
const setNotNullConstraint = (tableName, columnName) => {
	return assignTemplates({
		template: templates.alterNotNull,
		templateData: {
			tableName,
			columnName,
		},
	});
};

/**
 * @param tableName {string}
 * @param columnName {string}
 * @return string
 * */
const dropNotNullConstraint = (tableName, columnName) => {
	return assignTemplates({
		template: templates.dropNotNull,
		templateData: {
			tableName,
			columnName,
		},
	});
};

/**
 * @param {Object} collection
 * @return {AlterScriptDto[]}
 * */
const getModifyNonNullColumnsScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);

	const currentRequiredColumnNames = collection.required || [];
	const previousRequiredColumnNames = collection.role.required || [];

	const columnNamesToAddNotNullConstraint = _.difference(currentRequiredColumnNames, previousRequiredColumnNames);
	const columnNamesToRemoveNotNullConstraint = _.difference(previousRequiredColumnNames, currentRequiredColumnNames);

	const addNotNullConstraintsScript = _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			const oldName = jsonSchema.compMod.oldField.name;
			const shouldRemoveForOldName = columnNamesToRemoveNotNullConstraint.includes(oldName);
			const shouldAddForNewName = columnNamesToAddNotNullConstraint.includes(name);
			return shouldAddForNewName && !shouldRemoveForOldName;
		})
		.map(([name, jsonSchema]) => {
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			return { script: setNotNullConstraint(fullTableName, wrapInQuotes({ name })), isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, false));

	const removeNotNullConstraint = _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			const oldName = jsonSchema.compMod.oldField.name;
			const shouldRemoveForOldName = columnNamesToRemoveNotNullConstraint.includes(oldName);
			const shouldAddForNewName = columnNamesToAddNotNullConstraint.includes(name);
			return shouldRemoveForOldName && !shouldAddForNewName;
		})
		.map(([name, jsonSchema]) => {
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			return { script: dropNotNullConstraint(fullTableName, wrapInQuotes({ name })), isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, true));

	return [...addNotNullConstraintsScript, ...removeNotNullConstraint];
};

module.exports = {
	getModifyNonNullColumnsScriptDtos,
};
