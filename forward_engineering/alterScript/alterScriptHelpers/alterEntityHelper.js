const { getModifiedCommentOnColumnScriptDtos } = require('./columnHelpers/commentsHelper');
const { getModifyNonNullColumnsScriptDtos } = require('./columnHelpers/nonNullConstraintHelper');
const { getModifyCheckConstraintScriptDtos } = require('./entityHelpers/checkConstraintHelper');
const { getModifyEntityCommentsScriptDtos } = require('./entityHelpers/commentsHelper');
const { getModifyPkConstraintsScriptDtos } = require('./entityHelpers/primaryKeyHelper');
const { getModifyUkConstraintsScriptDtos } = require('./entityHelpers/uniqueKeyHelper');
const { getModifiedDefaultColumnValueScriptDtos } = require('./columnHelpers/defaultValueHelper');

const getModifyCollectionScriptDtos = collection => {
	const modifyCheckConstraintScriptDtos = getModifyCheckConstraintScriptDtos(collection);
	const modifyCommentScriptDtos = getModifyEntityCommentsScriptDtos(collection);
	return [...modifyCheckConstraintScriptDtos, ...modifyCommentScriptDtos].filter(Boolean);
};

const getModifyCollectionKeysScriptDtos = collection => {
	const modifyPkConstraintDtos = getModifyPkConstraintsScriptDtos(collection);
	const modifyUkConstraintDtos = getModifyUkConstraintsScriptDtos(collection);
	return [...modifyPkConstraintDtos, ...modifyUkConstraintDtos].filter(Boolean);
};

const getModifyColumnScriptDtos = collection => {
	const modifyNotNullScriptDtos = getModifyNonNullColumnsScriptDtos(collection);
	const modifyCommentScriptDtos = getModifiedCommentOnColumnScriptDtos(collection);
	const modifyDefaultColumnValueScriptDtos = getModifiedDefaultColumnValueScriptDtos({ collection });

	return [...modifyNotNullScriptDtos, ...modifyDefaultColumnValueScriptDtos, ...modifyCommentScriptDtos].filter(
		Boolean,
	);
};

module.exports = {
	getModifyCollectionScriptDtos,
	getModifyColumnScriptDtos,
	getModifyCollectionKeysScriptDtos,
};
