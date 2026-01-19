const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { getFullViewName, getSchemaOfAlterView } = require('../../../utils/general');
const { getKeys } = require('./getKeys');

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

	const oldFullViewName = getFullViewName({ ...viewSchema, code: oldName, name: oldName });
	const dropScript = ddlProvider.dropView({ viewName: oldFullViewName });

	const schemaData = { schemaName: viewSchema.schemaName || '' };
	const viewData = {
		name: newName,
		keys: getKeys({
			viewSchema,
			ddlProvider,
			mapProperties,
			collectionRefsDefinitionsMap: view.compMod?.collectionData?.collectionRefsDefinitionsMap ?? {},
		}),
		schemaData,
	};

	const hydratedView = ddlProvider.hydrateView({ viewData, entityData: [viewSchema] });
	const createScript = ddlProvider.createView(hydratedView, {}, viewSchema.isActivated);

	return AlterScriptDto.getInstance([dropScript, createScript], true, false);
};

module.exports = {
	getRenameViewScriptDto,
};
