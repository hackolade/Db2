const { getFullCollectionName, getSchemaOfAlterView, checkFieldPropertiesChanged } = require('../../../utils/general');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { createView } = require('./createView');

/**
 * @param {Object} view
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {AlterScriptDto | undefined}
 */
const getModifySelectStatementScriptDto = (view, ddlProvider, mapProperties) => {
	const viewSchema = getSchemaOfAlterView(view);

	if (!checkFieldPropertiesChanged(viewSchema?.compMod, ['selectStatement'])) {
		return undefined;
	}

	const fullViewName = getFullCollectionName(viewSchema);
	const dropScript = ddlProvider.dropView({ viewName: fullViewName });
	const createScript = createView(ddlProvider, mapProperties, view);

	return AlterScriptDto.getInstance([dropScript, createScript], true, false);
};

module.exports = {
	getModifySelectStatementScriptDto,
};
