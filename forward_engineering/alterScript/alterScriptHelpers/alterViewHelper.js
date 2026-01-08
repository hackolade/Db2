const { getModifyViewCommentsScriptDtos } = require('./viewHelpers/commentsHelper');

const getModifyViewScriptDtos = view => {
	const modifyCommentsScriptDtos = getModifyViewCommentsScriptDtos(view);

	return [...modifyCommentsScriptDtos].filter(Boolean);
};

module.exports = {
	getModifyViewScriptDtos,
};
