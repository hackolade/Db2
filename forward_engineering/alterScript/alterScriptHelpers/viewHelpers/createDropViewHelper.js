const { get } = require('lodash');
const {
	getSchemaOfAlterCollection,
	getSchemaNameFromCollection,
	getFullCollectionName,
} = require('../../../utils/general');

/**
 * @param {{
 *  viewSchema: Object,
 *  collectionRefsDefinitionsMap: Object,
 *  mapProperties: Function,
 *  ddlProvider: Object
 * }} param
 */
const getKeys = ({ viewSchema, collectionRefsDefinitionsMap, mapProperties, ddlProvider }) => {
	return mapProperties(viewSchema, (propertyName, schema) => {
		const definition = collectionRefsDefinitionsMap[schema.refId];

		if (!definition) {
			return ddlProvider.hydrateViewColumn({
				name: propertyName,
				isActivated: schema.isActivated,
			});
		}

		const entityName =
			get(definition.collection, '[0].code', '') || get(definition.collection, '[0].collectionName', '') || '';
		const dbName = get(definition.bucket, '[0].code') || get(definition.bucket, '[0].name', '');
		const name = definition.name;

		if (name === propertyName) {
			return ddlProvider.hydrateViewColumn({
				containerData: definition.bucket,
				entityData: definition.collection,
				isActivated: schema.isActivated,
				definition: definition.definition,
				entityName,
				name,
				dbName,
			});
		}

		return ddlProvider.hydrateViewColumn({
			containerData: definition.bucket,
			entityData: definition.collection,
			isActivated: schema.isActivated,
			definition: definition.definition,
			alias: propertyName,
			entityName,
			name,
			dbName,
		});
	});
};

/**
 * @param {{
 *  ddlProvider: Object,
 *  mapProperties: Function,
 *  view: Object
 * }} param
 * @returns {string}
 */
const createView = ({ ddlProvider, mapProperties, view }) => {
	const viewSchema = getSchemaOfAlterCollection(view);
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

/**
 * @param {{
 *  ddlProvider: Object,
 *  viewSchema: Object
 * }} param
 * @returns {string}
 */
const dropView = ({ ddlProvider, viewSchema }) => {
	const viewName = getFullCollectionName(viewSchema);

	return ddlProvider.dropView({ viewName });
};

module.exports = {
	createView,
	dropView,
};
