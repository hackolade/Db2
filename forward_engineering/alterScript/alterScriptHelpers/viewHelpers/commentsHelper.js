const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getFullCollectionName,
	getSchemaOfAlterCollection,
} = require('../../../utils/general');
const { getTableCommentStatement } = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');

const extractDescription = view => {
	return view?.role?.compMod?.description || {};
};

const getUpsertCommentsScriptDto = view => {
	const description = extractDescription(view);
	if (description.new && description.new !== description.old) {
		const comment = description.new;

		const viewSchema = getSchemaOfAlterCollection(view);
		const viewName = getFullCollectionName(viewSchema);

		const isContainerActivated = isParentContainerActivated(view);
		const isViewActivated = isContainerActivated && isObjectInDeltaModelActivated(view);

		const script = getTableCommentStatement({ tableName: viewName, description: comment });

		return AlterScriptDto.getInstance([script], isViewActivated, false);
	}
	return undefined;
};

const getDropCommentsScriptDto = view => {
	const description = extractDescription(view);

	if (description.old && !description.new) {
		const viewSchema = getSchemaOfAlterCollection(view);
		const viewName = getFullCollectionName(viewSchema);

		const isContainerActivated = isParentContainerActivated(view);
		const isViewActivated = isContainerActivated && isObjectInDeltaModelActivated(view);

		const script = getTableCommentStatement({ tableName: viewName, description: '' });
		return AlterScriptDto.getInstance([script], isViewActivated, true);
	}
	return undefined;
};

const getModifyViewCommentsScriptDtos = view => {
	const upsertCommentScript = getUpsertCommentsScriptDto(view);
	const dropCommentScript = getDropCommentsScriptDto(view);
	return [upsertCommentScript, dropCommentScript].filter(Boolean);
};

module.exports = {
	getModifyViewCommentsScriptDtos,
};
