const { getModifyNonNullColumnsScriptDtos } = require('./columnHelpers/nonNullConstraintHelper');
const { getModifyCheckConstraintScriptDtos } = require('./entityHelpers/checkConstraintHelper');
const { getModifyPkConstraintsScriptDtos } = require('./entityHelpers/primaryKeyHelper');
const { getModifyUkConstraintsScriptDtos } = require('./entityHelpers/uniqueKeyHelper');

const getModifyCollectionScriptDtos = collection => {
	const modifyCheckConstraintScriptDtos = getModifyCheckConstraintScriptDtos(collection);
	// const modifyCommentScriptDtos = getModifyEntityCommentsScriptDtos(...);
	return [
		...modifyCheckConstraintScriptDtos,
		// ...modifyCommentScriptDtos,
	].filter(Boolean);
};

const getModifyCollectionKeysScriptDtos = collection => {
	const modifyPkConstraintDtos = getModifyPkConstraintsScriptDtos(collection);
	const modifyUkConstraintDtos = getModifyUkConstraintsScriptDtos(collection);
	return [...modifyPkConstraintDtos, ...modifyUkConstraintDtos].filter(Boolean);
};

const getModifyColumnScriptDtos = collection => {
	const modifyNotNullScriptDtos = getModifyNonNullColumnsScriptDtos(collection);
	// const modifyCommentScriptDtos = getModifiedCommentOnColumnScriptDtos(...);
	// const modifyDefaultColumnValueScriptDtos = getModifiedDefaultColumnValueScriptDtos(...);

	return [
		...modifyNotNullScriptDtos,
		// ...modifyDefaultColumnValueScriptDtos,
		// ...modifyCommentScriptDtos,
	].filter(Boolean);
};

module.exports = {
	getModifyCollectionScriptDtos,
	getModifyColumnScriptDtos,
	getModifyCollectionKeysScriptDtos,
};
