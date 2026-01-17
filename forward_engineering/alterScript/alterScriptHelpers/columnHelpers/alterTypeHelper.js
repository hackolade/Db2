const { toPairs } = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	checkFieldPropertiesChanged,
	getFullCollectionName,
	wrapInQuotes,
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getSchemaOfAlterCollection,
	getSchemaNameFromCollection,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');
const { createColumnDefinitionBySchema } = require('../createColumnDefinition');
const { getColumnType } = require('../../../ddlProvider/ddlHelpers/columnDefinition/getColumnType');

/**
 * @param {string} tableName
 * @param {string} columnName
 * @param {string} dataType
 * @return string
 * */
const alterColumnType = (tableName, columnName, dataType) => {
	return assignTemplates({
		template: templates.updateColumnType,
		templateData: {
			tableName,
			columnName,
			dataType,
		},
	});
};

/**
 * @return {boolean}
 * */
const hasLengthChanged = (collection, oldFieldName, currentJsonSchema) => {
	const oldProperty = collection.role.properties[oldFieldName];

	const previousLength = oldProperty?.length;
	const newLength = currentJsonSchema?.length;
	return previousLength !== newLength;
};

/**
 * @return {boolean}
 * */
const hasPrecisionOrScaleChanged = (collection, oldFieldName, currentJsonSchema) => {
	const oldProperty = collection.role.properties[oldFieldName];

	const previousPrecision = oldProperty?.precision;
	const newPrecision = currentJsonSchema?.precision;
	const previousScale = oldProperty?.scale;
	const newScale = currentJsonSchema?.scale;

	return previousPrecision !== newPrecision || previousScale !== newScale;
};

/**
 * @param {Object} ddlProvider
 * @return {(collection: Object) => Array<AlterScriptDto>}
 * */
const getUpdateTypesScriptDtos = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const schemaName = getSchemaNameFromCollection({ collection });
	const schemaData = { schemaName };

	return toPairs(collection.properties)
		.filter(([_, jsonSchema]) => {
			if (!jsonSchema.compMod) {
				return false;
			}
			const hasTypeChanged = checkFieldPropertiesChanged(jsonSchema.compMod, ['type', 'mode']);
			if (!hasTypeChanged) {
				const oldName = jsonSchema.compMod.oldField.name;
				const isNewLength = hasLengthChanged(collection, oldName, jsonSchema);
				const isNewPrecisionOrScale = hasPrecisionOrScaleChanged(collection, oldName, jsonSchema);
				return isNewLength || isNewPrecisionOrScale;
			}
			return true;
		})
		.map(([columnName, jsonSchema]) => {
			const columnDefinition = createColumnDefinitionBySchema({
				name: columnName,
				jsonSchema,
				parentJsonSchema: collectionSchema,
				ddlProvider,
				schemaData,
			});

			const dataType = getColumnType(columnDefinition).trim();

			const columnNameQuoted = wrapInQuotes(columnName);
			const script = alterColumnType(fullTableName, columnNameQuoted, dataType);
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;

			return AlterScriptDto.getInstance([script], isActivated, false);
		});
};

module.exports = {
	getUpdateTypesScriptDtos,
};
