const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { getFullCollectionName, getSchemaOfAlterCollection, isViewActivated } = require('../../../utils/general');
const {
	getTableCommentStatement,
	dropTableCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');

const extractDescription = view => {
	return view?.role?.compMod?.description || {};
};

const getUpsertCommentsScriptDto = view => {
	const description = extractDescription(view);
	if (description.new && description.new !== description.old) {
		const comment = description.new;

		const viewSchema = getSchemaOfAlterCollection(view);
		const viewName = getFullCollectionName({
			collectionSchema: viewSchema,
		});

		const script = getTableCommentStatement({ tableName: viewName, description: comment });

		return AlterScriptDto.getInstance([script], isViewActivated(view), false);
	}
	return undefined;
};

const getDropCommentsScriptDto = view => {
	const description = extractDescription(view);

	if (description.old && !description.new) {
		const viewSchema = getSchemaOfAlterCollection(view);
		const viewName = getFullCollectionName({
			collectionSchema: viewSchema,
		});

		const script = dropTableCommentStatement({ tableName: viewName });
		return AlterScriptDto.getInstance([script], isViewActivated(view), true);
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
