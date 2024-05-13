/**
 * @typedef {{
 *  properties?: { [key: string]: JsonSchema },
 * items?: JsonSchema[],
 * name?: string,
 * code?: string,
 * collectionName?: string,
 * }} JsonSchema
 */

/**
 * @param {{ item: JsonSchema }}
 * @returns {string}
 */
const getName = ({ item = {} }) => item.code || item.collectionName || item.name || '';

/**
 * @type
 * @typedef {({ propertyName, property, path }: {propertyName: string, property: object, path: string[]}) => void} Callback
 * @param {{ jsonSchema: JsonSchema, path: string[], callback: Callback }}
 * @returns {void}
 */
const eachProperty = ({ jsonSchema, path, callback }) => {
	if (jsonSchema.properties) {
		Object.entries(jsonSchema.properties).forEach(([propertyName, property]) => {
			const nextPath = [...path, property.GUID];

			callback({ propertyName, property, path: nextPath });

			eachProperty({ jsonSchema: property, path: nextPath, callback });
		});
	}

	if (jsonSchema.items) {
		const items = Array.isArray(jsonSchema.items) ? jsonSchema.items : [jsonSchema.items];

		items.forEach((item, i) => {
			const nextPath = [...path, item.GUID];

			callback({ propertyName: i, property: item, path: nextPath });

			eachProperty({ jsonSchema: item, path: nextPath, callback });
		});
	}
};

/**
 * @param {{ jsonSchema: JsonSchema }}
 * @returns {{ [key: string]: string }}
 */
const getIdToNameHashTable = ({ jsonSchema = {} }) => {
	let IdToNameHashTable = {};

	const callback = ({ propertyName, property }) => {
		IdToNameHashTable[property.GUID] = getName({ item: property }) || propertyName;
	};

	eachProperty({ jsonSchema, path: [], callback });

	return IdToNameHashTable;
};

module.exports = {
	getIdToNameHashTable,
	getName,
};
