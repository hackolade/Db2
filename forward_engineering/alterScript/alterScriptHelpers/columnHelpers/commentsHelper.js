const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getSchemaOfAlterCollection,
	getFullCollectionName,
} = require('../../../utils/general');
const {
	getColumnCommentStatement,
	dropTableColumnCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');

const getUpdatedCommentOnColumnScriptDtos = collection => {
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getFullCollectionName(collectionSchema);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			const newComment = jsonSchema.description;
			const oldName = jsonSchema.compMod.oldField.name;
			const oldComment = collection.role.properties[oldName]?.description;
			return newComment && (!oldComment || newComment !== oldComment);
		})
		.map(([columnName, jsonSchema]) => {
			const newComment = jsonSchema.description;
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			const script = getColumnCommentStatement({ tableName, columnName, description: newComment });

			return { script, isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, false));
};

const getDeletedCommentOnColumnScriptDtos = collection => {
	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isObjectInDeltaModelActivated(collection);
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getFullCollectionName(collectionSchema);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			const newComment = jsonSchema.description;
			const oldName = jsonSchema.compMod.oldField.name;
			const oldComment = collection.role.properties[oldName]?.description;
			return oldComment && !newComment;
		})
		.map(([columnName, jsonSchema]) => {
			const isActivated = isContainerActivated && isCollectionActivated && jsonSchema.isActivated;
			const script = dropTableColumnCommentStatement({ tableName, columnName });

			return { script, isActivated };
		})
		.map(({ script, isActivated }) => AlterScriptDto.getInstance([script], isActivated, true));
};

const getModifiedCommentOnColumnScriptDtos = collection => {
	const updatedCommentScripts = getUpdatedCommentOnColumnScriptDtos(collection);
	const deletedCommentScripts = getDeletedCommentOnColumnScriptDtos(collection);
	return [...updatedCommentScripts, ...deletedCommentScripts];
};

module.exports = {
	getModifiedCommentOnColumnScriptDtos,
};
