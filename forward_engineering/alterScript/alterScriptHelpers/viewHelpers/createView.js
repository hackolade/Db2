const { getSchemaOfAlterView, getSchemaNameFromCollection } = require('../../../utils/general');
const { getKeys } = require('./getKeys');

/**
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @param {Object} view
 * @returns {string}
 */
const createView = (ddlProvider, mapProperties, view) => {
	const viewSchema = getSchemaOfAlterView(view);
	const schemaName = getSchemaNameFromCollection({ collection: viewSchema }) || '';
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

	return script;
};

module.exports = {
	createView,
};
