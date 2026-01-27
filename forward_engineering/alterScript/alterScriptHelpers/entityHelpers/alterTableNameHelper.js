const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	isParentContainerActivated,
	isObjectInDeltaModelActivated,
	getSchemaOfAlterCollection,
	getSchemaNameFromCollection,
	getNamePrefixedWithSchemaName,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');

/**
 * @param {string} oldTableName
 * @param {string} newTableName
 * @return string
 */
const alterTableName = (oldTableName, newTableName) => {
	return assignTemplates({ template: templates.renameTable, templateData: { oldTableName, newTableName } });
};

/**
 * @param {Object} collection
 * @returns {Array<AlterScriptDto>}
 */
const getRenameTableScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = collectionSchema?.compMod?.collectionName;

	if (!tableName) {
		return [];
	}

	const { old: oldName, new: newName } = tableName;

	if (!newName || newName === oldName) {
		return [];
	}

	const schemaName = getSchemaNameFromCollection({ collection: collectionSchema });
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	const script = alterTableName(
		getNamePrefixedWithSchemaName({ name: oldName, schemaName }),
		getNamePrefixedWithSchemaName({ name: newName, schemaName }),
	);

	return [AlterScriptDto.getInstance([script], isCollectionActivated, false)];
};

module.exports = {
	getRenameTableScriptDtos,
};
