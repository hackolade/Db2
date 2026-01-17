const { toPairs } = require('lodash');
const {
	getSchemaOfAlterCollection,
	getFullCollectionName,
	isParentContainerActivated,
	isObjectInDeltaModelActivated,
	getSchemaNameFromCollection,
	wrapInQuotes,
} = require('../../../utils/general');
const templates = require('../../../ddlProvider/templates');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { assignTemplates } = require('../../../utils/assignTemplates');

/**
 * @param {Object} ddlProvider
 * @return {(collection: Object) => Array<AlterScriptDto>}
 * */
const getRenameColumnScriptDtos = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const schemaName = getSchemaNameFromCollection({ collection });
	const schemaData = { schemaName };

	return toPairs(collection.properties)
		.map(([_, jsonSchema]) => {
			if (!jsonSchema.compMod) {
				return false;
			}
			const compMod = jsonSchema.compMod || {};
			const { newField = {}, oldField = {} } = compMod;

			if (newField.name && oldField.name && newField.name !== oldField.name) {
				const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
				const script = assignTemplates({
					template: templates.renameColumn,
					templateData: {
						tableName: fullTableName,
						oldColumnName: wrapInQuotes(oldField.name),
						newColumnName: wrapInQuotes(newField.name),
					},
				});

				return AlterScriptDto.getInstance([script], isActivated, false);
			}

			return null;
		})
		.filter(Boolean);
};

module.exports = {
	getRenameColumnScriptDtos,
};
