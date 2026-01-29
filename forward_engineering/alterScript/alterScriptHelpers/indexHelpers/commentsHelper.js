const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getSchemaNameFromCollection,
	getNamePrefixedWithSchemaName,
	wrapInQuotes,
	isObjectInDeltaModelActivated,
} = require('../../../utils/general');
const {
	getIndexCommentStatement,
	dropIndexCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');

/**
 * @param {{
 *  newIndex: Object,
 *  oldIndex: Object,
 *  collection: Object
 * }} param
 * @returns {AlterScriptDto|undefined}
 */
const getModifyIndexCommentsScriptDtos = ({ newIndex, oldIndex, collection }) => {
	const newDescription = newIndex.indxDescription;
	const oldDescription = oldIndex.indxDescription;
	const schemaName = getSchemaNameFromCollection({ collection });
	const fullIndexName = getNamePrefixedWithSchemaName({
		name: newIndex.indxName,
		schemaName,
	});

	const isActivated = isObjectInDeltaModelActivated(collection) && newIndex.isActivated;

	if (newDescription && newDescription !== oldDescription) {
		const script = getIndexCommentStatement({
			indexName: fullIndexName,
			description: newDescription,
		});
		return AlterScriptDto.getInstance([script], isActivated, false);
	}

	if (oldDescription && !newDescription) {
		const script = dropIndexCommentStatement({
			indexName: fullIndexName,
		});
		return AlterScriptDto.getInstance([script], isActivated, true);
	}

	return undefined;
};

module.exports = {
	getModifyIndexCommentsScriptDtos,
};
