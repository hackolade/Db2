const { getSchemaOfAlterCollection } = require('../../../utils/general');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { createView, dropView, isViewActivated } = require('./createDropViewHelper');

/**
 * @param {Object} view
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {AlterScriptDto | undefined}
 */
const getModifySelectStatementScriptDtos = (view, ddlProvider, mapProperties) => {
	const viewSchema = getSchemaOfAlterCollection(view);
	const selectStatement = viewSchema?.compMod?.selectStatement || {};

	if ((!selectStatement.new && !selectStatement.old) || selectStatement.new === selectStatement.old) {
		return [undefined];
	}

	const dropScript = dropView({ viewSchema, ddlProvider });
	const createScript = createView({ ddlProvider, mapProperties, view });

	return [
		AlterScriptDto.getInstance([dropScript], isViewActivated(view), true),
		AlterScriptDto.getInstance([createScript], isViewActivated(view), false),
	];
};

module.exports = {
	getModifySelectStatementScriptDtos,
};
