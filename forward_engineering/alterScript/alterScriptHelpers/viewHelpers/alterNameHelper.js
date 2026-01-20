const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { getFullCollectionName, getSchemaOfAlterCollection } = require('../../../utils/general');
const { createView, dropView } = require('./createDropViewHelper');

/**
 * @param {Object} view
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @return {AlterScriptDto | undefined}
 */
const getRenameViewScriptDtos = (view, ddlProvider, mapProperties) => {
	const viewSchema = getSchemaOfAlterCollection(view);
	const viewName = viewSchema?.compMod?.name;

	if (!viewName) {
		return [undefined];
	}

	const { old: oldName, new: newName } = viewName;

	if (!newName || newName === oldName) {
		return [undefined];
	}

	const dropScript = dropView({
		ddlProvider,
		viewSchema: { ...viewSchema, code: oldName, name: oldName },
	});
	const createScript = createView({ ddlProvider, mapProperties, view });

	return [
		AlterScriptDto.getInstance([dropScript], true, true),
		AlterScriptDto.getInstance([createScript], true, false),
	];
};

module.exports = {
	getRenameViewScriptDtos,
};
