const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getSchemaCommentStatement,
	dropSchemaCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');
const { wrapInQuotes } = require('../../../utils/general');

const getModifiedCommentOnSchemaScriptDtos = ({ schemaName, compMod, isActivated }) => {
	const scripts = [];
	const description = compMod.description || {};

	if (description.new && description.new !== description.old) {
		const script = getSchemaCommentStatement({ schemaName, description: description.new });
		scripts.push(AlterScriptDto.getInstance([script], isActivated, false));
	}

	if (description.old && !description.new) {
		const script = dropSchemaCommentStatement({ schemaName });
		scripts.push(AlterScriptDto.getInstance([script], isActivated, true));
	}

	return scripts;
};

module.exports = {
	getModifiedCommentOnSchemaScriptDtos,
};
