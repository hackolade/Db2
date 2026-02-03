const { toPairs } = require('lodash');
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
 * @param {Object} props
 * @param {string} props.tableName
 * @param {string} props.columnName
 * @param {string} props.defaultValue
 * @return string
 */
const updateColumnDefaultValue = ({ tableName, columnName, defaultValue }) => {
	const templateConfig = {
		tableName,
		columnName,
		defaultValue,
	};
	return assignTemplates({ template: templates.updateColumnDefaultValue, templateData: templateConfig });
};

/**
 * @param {Object} props
 * @param {Object} props.collection
 * @returns { Array<AlterScriptDto> }
 */
const getUpdatedDefaultColumnValueScriptDtos = ({ collection }) => {
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const collectionSchema = getSchemaOfAlterCollection(collection);

	return toPairs(collection.properties)
		.filter(([_name, jsonSchema]) => {
			const newDefault = jsonSchema.default;
			const oldName = jsonSchema.compMod.oldField.name;
			const oldDefault = collection.role.properties[oldName]?.default;
			return newDefault !== undefined && (!oldDefault || newDefault !== oldDefault);
		})
		.map(([columnName, jsonSchema]) => {
			const newDefaultValue = jsonSchema.default;
			const scriptGenerationConfig = {
				tableName: getFullCollectionName({ collectionSchema }),
				columnName: wrapInQuotes(columnName),
				defaultValue: newDefaultValue,
			};
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			return { script: updateColumnDefaultValue(scriptGenerationConfig), isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, false))
		.filter(Boolean);
};

/**
 * @param {Object} props
 * @param {string} props.tableName
 * @param {string} props.columnName
 * @return string
 */
const dropColumnDefaultValue = ({ tableName, columnName }) => {
	const templateConfig = {
		tableName,
		columnName,
	};
	return assignTemplates({ template: templates.dropColumnDefaultValue, templateData: templateConfig });
};

/**
 * @param {Object} props
 * @param {Object} props.collection
 * @returns { Array<AlterScriptDto> }
 */
const getDeletedDefaultColumnValueScriptDtos = ({ collection }) => {
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const collectionSchema = getSchemaOfAlterCollection(collection);

	return toPairs(collection.properties)
		.filter(([_name, jsonSchema]) => {
			const newDefault = jsonSchema.default;
			const oldName = jsonSchema.compMod.oldField.name;
			const oldDefault = collection.role.properties[oldName]?.default;
			const hasPrevValue = oldDefault !== undefined;
			const hasNewValue = newDefault !== undefined;
			return hasPrevValue && !hasNewValue;
		})
		.map(([columnName, jsonSchema]) => {
			const scriptGenerationConfig = {
				tableName: getFullCollectionName({ collectionSchema }),
				columnName: wrapInQuotes(columnName),
			};
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			return { script: dropColumnDefaultValue(scriptGenerationConfig), isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, true))
		.filter(Boolean);
};

/**
 * @param {Object} props
 * @param {Object} props.collection
 * @returns { Array<AlterScriptDto> }
 */
const getModifiedDefaultColumnValueScriptDtos = ({ collection }) => {
	const updatedDefaultValuesScriptDtos = getUpdatedDefaultColumnValueScriptDtos({ collection });
	const dropDefaultValuesScriptDtos = getDeletedDefaultColumnValueScriptDtos({ collection });
	return [...updatedDefaultValuesScriptDtos, ...dropDefaultValuesScriptDtos];
};

module.exports = {
	getModifiedDefaultColumnValueScriptDtos,
};
