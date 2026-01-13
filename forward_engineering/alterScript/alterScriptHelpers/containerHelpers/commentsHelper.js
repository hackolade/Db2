const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getSchemaCommentStatement,
	dropSchemaCommentStatement,
} = require('../../../ddlProvider/ddlHelpers/comment/commentHelper');
const { wrapInQuotes } = require('../../../utils/general');

const getModifiedCommentOnSchemaScriptDtos = ({ schemaName, compMod, isActivated }) => {
	const description = compMod.description || {};

	if (description.new && description.new !== description.old) {
		const script = getSchemaCommentStatement({ schemaName, description: description.new });
		return AlterScriptDto.getInstance([script], isActivated, false);
	}

	if (description.old && !description.new) {
		const script = dropSchemaCommentStatement({ schemaName });
		return AlterScriptDto.getInstance([script], isActivated, true);
	}

	return undefined;
};

module.exports = {
	getModifiedCommentOnSchemaScriptDtos,
};
