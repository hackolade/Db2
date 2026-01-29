const { toPairs } = require('lodash');
const { getSchemaNameFromCollection } = require('../../../utils/general');

/**
 * @param {string} columnId
 * @param {Object} collection
 * @return {string | undefined}
 * */
const getColumnNameById = ({ columnId, collection }) => {
	const collectionProperties = toPairs(collection?.role?.properties || collection?.properties || {}).map(
		([name, value]) => ({ ...value, name }),
	);
	const oldProperties = (collection?.role?.compMod?.oldProperties || []).map(property => ({
		...property,
		GUID: property.id,
	}));
	const properties = collectionProperties.length > 0 ? collectionProperties : oldProperties;
	const propertySchema = properties.find(fieldJsonSchema => fieldJsonSchema.GUID === columnId);

	if (propertySchema) {
		return propertySchema.name;
	}

	return undefined;
};

/**
 * @param {AlterIndexDto} index
 * @param {Object} collection
 * @return {Object}
 * */
const addNameToIndexKey = ({ index, collection }) => {
	if (!index?.indxKey?.length) {
		return index;
	}

	const schemaName = getSchemaNameFromCollection({ collection });

	const columnsWithNames = index.indxKey
		.map(column => {
			return {
				...column,
				name: getColumnNameById({ columnId: column.keyId, collection }),
			};
		})
		.filter(column => Boolean(column.name));

	return {
		...index,
		schemaName,
		indxKey: columnsWithNames,
	};
};

module.exports = {
	addNameToIndexKey,
};
