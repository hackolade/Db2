const { get } = require('lodash');

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

module.exports = {
	getKeys,
};
