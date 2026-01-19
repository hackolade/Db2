/**
 * @typedef {import('../../../shared/types').App} App
 */
const { getModifyViewCommentsScriptDtos } = require('./viewHelpers/commentsHelper');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { wrapInQuotes, getSchemaOfAlterView, getFullViewName } = require('../../utils/general');
const { getKeys } = require('./viewHelpers/getKeys');

/**
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {(view: Object) => AlterScriptDto}
 */
const getAddViewScriptDto = (ddlProvider, mapProperties) => view => {
	const viewSchema = { ...view, ...(view.role || {}) };
	const schemaName = viewSchema.schemaName || '';
	const schemaData = { schemaName };

	const viewData = {
		name: viewSchema.code || viewSchema.name,
		keys: getKeys({
			viewSchema,
			ddlProvider,
			mapProperties,
			collectionRefsDefinitionsMap: view.compMod?.collectionData?.collectionRefsDefinitionsMap ?? {},
		}),
		schemaData,
	};

	const hydratedView = ddlProvider.hydrateView({ viewData, entityData: [viewSchema] });
	const script = ddlProvider.createView(hydratedView, {}, viewSchema.isActivated);

	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {Object} ddlProvider
 * @returns {(view: Object) => AlterScriptDto}
 */
const getDeleteViewScriptDto = ddlProvider => view => {
	const viewSchema = getSchemaOfAlterView(view);
	const fullViewName = getFullViewName(viewSchema);
	const script = ddlProvider.dropView({ viewName: fullViewName });

	return AlterScriptDto.getInstance([script], true, true);
};

const getModifyViewScriptDtos = view => {
	const modifyCommentsScriptDtos = getModifyViewCommentsScriptDtos(view);

	return [...modifyCommentsScriptDtos].filter(Boolean);
};

/**
 * @param {App} app
 */
const getViewsScripts = app => {
	const ddlProvider = require('../../ddlProvider/ddlProvider')(null, null, app);
	const { mapProperties } = app.require('@hackolade/ddl-fe-utils');

	return {
		getAddViewScriptDto: getAddViewScriptDto(ddlProvider, mapProperties),
		getDeleteViewScriptDto: getDeleteViewScriptDto(ddlProvider),
		getModifyViewScriptDtos,
	};
};

module.exports = {
	getViewsScripts,
};
