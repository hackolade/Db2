const getModifyCollectionScriptDtos =
	({}) =>
	collection => {
		// const modifyCheckConstraintScriptDtos = getModifyCheckConstraintScriptDtos(...);
		// const modifyCommentScriptDtos = getModifyEntityCommentsScriptDtos(...);
		return [
			// ...modifyCheckConstraintScriptDtos,
			// ...modifyCommentScriptDtos,
		].filter(Boolean);
	};

const getModifyCollectionKeysScriptDtos =
	({}) =>
	collection => {
		// const modifyPkConstraintDtos = getModifyPkConstraintScriptDtos(...);
		// const modifyUkConstraintDtos = getModifyUkConstraintsScriptDtos(...);
		return [
			// ...modifyPkConstraintDtos,
			// ...modifyUniqueKeyConstraintDtos,
		].filter(Boolean);
	};

const getModifyColumnScriptDtos =
	({}) =>
	collection => {
		// const modifyNotNullScriptDtos = getModifyNonNullColumnScriptDtos(...);
		// const modifyCommentScriptDtos = getModifiedCommentOnColumnScriptDtos(...);
		// const modifyDefaultColumnValueScriptDtos = getModifiedDefaultColumnValueScriptDtos(...);

		return [
			// ...modifyNotNullScriptDtos,
			// ...modifyDefaultColumnValueScriptDtos,
			// ...modifyCommentScriptDtos,
		].filter(Boolean);
	};

module.exports = {
	getModifyCollectionScriptDtos,
	getModifyColumnScriptDtos,
	getModifyCollectionKeysScriptDtos,
};
