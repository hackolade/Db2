const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getSchemaOfAlterCollection,
	getFullCollectionName,
} = require('../../../utils/general');
const {
	getTableCommentStatement,
	dropTableCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');

const getUpdatedCommentOnCollectionScriptDto = collection => {
	const descriptionInfo = collection?.role.compMod?.description;
	if (!descriptionInfo) {
		return undefined;
	}

	const { old: oldComment, new: newComment } = descriptionInfo;
	if (!newComment || newComment === oldComment) {
		return undefined;
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getFullCollectionName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	const script = getTableCommentStatement({ tableName, description: newComment });
	return AlterScriptDto.getInstance([script], isCollectionActivated, false);
};

const getDeletedCommentOnCollectionScriptDto = collection => {
	const descriptionInfo = collection?.role.compMod?.description;
	if (!descriptionInfo) {
		return undefined;
	}

	const { old: oldComment, new: newComment } = descriptionInfo;
	if (!oldComment || newComment) {
		return undefined;
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getFullCollectionName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	const script = dropTableCommentStatement({ tableName });
	return AlterScriptDto.getInstance([script], isCollectionActivated, true);
};

const getModifyEntityCommentsScriptDtos = collection => {
	const updatedCommentScript = getUpdatedCommentOnCollectionScriptDto(collection);
	const deletedCommentScript = getDeletedCommentOnCollectionScriptDto(collection);

	return [updatedCommentScript, deletedCommentScript].filter(Boolean);
};

module.exports = {
	getModifyEntityCommentsScriptDtos,
};
