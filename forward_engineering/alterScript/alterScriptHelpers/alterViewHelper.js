// const { getModifyViewCommentsScriptDtos } = require('./viewHelpers/commentsHelper');

const getModifyViewScriptDtos = view => {
	// const modifyCommentsScriptDtos = getModifyViewCommentsScriptDtos(...);

	return [
		// ...modifyCommentsScriptDtos,
	].filter(Boolean);
};

module.exports = {
	getModifyViewScriptDtos,
};
