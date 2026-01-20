const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { getFullCollectionName, getSchemaOfAlterView } = require('../../../utils/general');
const { getKeys } = require('./getKeys');
const { createView } = require('./createView');

/**
 * @param {Object} view
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @return {AlterScriptDto | undefined}
 */
const getRenameViewScriptDto = (view, ddlProvider, mapProperties) => {
	const viewSchema = getSchemaOfAlterView(view);
	const viewName = viewSchema?.compMod?.name;

	if (!viewName) {
		return undefined;
	}

	const { old: oldName, new: newName } = viewName;

	if (!newName || newName === oldName) {
		return undefined;
	}

	const oldFullViewName = getFullCollectionName({ ...viewSchema, code: oldName, name: oldName });
	const dropScript = ddlProvider.dropView({ viewName: oldFullViewName });

	const createScript = createView(ddlProvider, mapProperties, view);

	return AlterScriptDto.getInstance([dropScript, createScript], true, false);
};

module.exports = {
	getRenameViewScriptDto,
};
