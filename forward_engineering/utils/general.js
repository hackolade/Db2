const { toLower, omit, isEqual } = require('lodash');
const { INLINE_COMMENT } = require('../../constants/constants');

/**
 * @param {{ text: string, tab: string }}
 * @returns {string}
 */
const setTab = ({ text, tab = '\t' }) => {
	return text
		.split('\n')
		.map(line => tab + line)
		.join('\n');
};

/**
 * @param {{ descriptors: object, type: string }}
 * @returns {boolean}
 */
const hasType = ({ descriptors, type }) => {
	return Object.keys(descriptors).map(toLower).includes(toLower(type));
};

/**
 * @param {{ key?: object }}
 * @returns {boolean}
 */
const checkIsKeyActivated = ({ key }) => {
	return key?.isActivated ?? true;
};

/**
 * @param {{ keys: object[] }}
 * @returns {boolean}
 */
const checkAllKeysDeactivated = ({ keys }) => {
	return keys.length ? keys.every(key => !checkIsKeyActivated({ key })) : false;
};

/**
 * @template {object} T
 * @template {any} K
 * @param {{ items: T[], mapFunction: (item: T) => K }}
 * @returns {{ activatedItems: K[], deactivatedItems: K[]}}
 */
const divideIntoActivatedAndDeactivated = ({ items, mapFunction }) => {
	const activatedItems = items.filter(item => checkIsKeyActivated({ key: item })).map(mapFunction);
	const deactivatedItems = items.filter(item => !checkIsKeyActivated({ key: item })).map(mapFunction);

	return { activatedItems, deactivatedItems };
};

/**
 * @param {string} statement
 * @param {{ isActivated: boolean, isPartOfLine: boolean, inlineComment: string }}
 * @returns {string}
 */
const commentIfDeactivated = (statement, { isActivated, isPartOfLine, inlineComment = INLINE_COMMENT }) => {
	if (isActivated !== false) {
		return statement;
	}

	if (isPartOfLine) {
		return '/* ' + statement + ' */';
	}

	if (statement.includes('\n')) {
		return '/*\n' + statement + ' */\n';
	}
	return inlineComment + ' ' + statement;
};

/**
 * @param {{ name: string }}
 * @returns {string}
 */
const wrapInQuotes = str => `"${str}"`;

/**
 * @param {{ name: string }}
 * @returns {string}
 */
const wrapInSingleQuotes = ({ name }) => `'${name}'`;

const removeAllQuotes = str => str.replaceAll(/['"]/g, '');

/**
 * @param {{ name: string, schemaName?: string }}
 * @returns {string}
 */
const getNamePrefixedWithSchemaName = ({ name, schemaName }) => {
	if (schemaName) {
		return `${wrapInQuotes(schemaName)}.${wrapInQuotes(name)}`;
	}

	return wrapInQuotes(name);
};

const columnMapToString = ({ name }) => wrapInQuotes(name);

const getColumnsList = (columns, isAllColumnsDeactivated, isParentActivated, mapColumn = columnMapToString) => {
	const dividedColumns = divideIntoActivatedAndDeactivated({ items: columns, mapFunction: mapColumn });
	const deactivatedColumnsAsString = dividedColumns?.deactivatedItems?.length
		? commentIfDeactivated(dividedColumns.deactivatedItems.join(', '), {
				isActivated: false,
				isPartOfLine: true,
			})
		: '';

	return !isAllColumnsDeactivated && isParentActivated
		? ' (' + dividedColumns.activatedItems.join(', ') + deactivatedColumnsAsString + ')'
		: ' (' + columns.map(mapColumn).join(', ') + ')';
};

/**
 * @template {object} T
 * @param {{ value: T | T[] }}
 * @returns {T[]}
 */
const toArray = ({ value }) => (Array.isArray(value) ? value : [value]);

const getEntityName = entityData => {
	return entityData?.code || entityData?.collectionName || entityData?.name || '';
};

const getSchemaNameFromCollection = ({ collection }) => {
	return collection.compMod?.keyspaceName;
};

const getFullCollectionName = collectionSchema => {
	const name = getEntityName(collectionSchema);
	const schemaName = getSchemaNameFromCollection({ collection: collectionSchema });
	return getNamePrefixedWithSchemaName({ name, schemaName });
};

const getSchemaOfAlterCollection = collection => {
	return { ...collection, ...(omit(collection?.role, 'properties') || {}) };
};

const getSchemaOfAlterView = view => {
	return { ...view, ...(omit(view?.role, 'properties') || {}) };
};

const isObjectInDeltaModelActivated = modelObject => {
	return modelObject.compMod?.isActivated?.new ?? modelObject.role?.isActivated;
};

const isParentContainerActivated = collection => {
	return (
		collection?.compMod?.bucketProperties?.isActivated ?? collection?.role?.compMod?.bucketProperties?.isActivated
	);
};

const checkFieldPropertiesChanged = (compMod, propertiesToCheck) => {
	return propertiesToCheck.some(prop => compMod?.oldField[prop] !== compMod?.newField[prop]);
};

/**
 *
 * @template {object} T
 * @param {{ new: T, old: T }}
 * @returns {boolean}
 */
const compareProperties = ({ new: newProperty, old: oldProperty }) => {
	if (!newProperty && !oldProperty) {
		return;
	}
	return !isEqual(newProperty, oldProperty);
};

/**
 * @param {object} compMod
 * @param {string[]} properties
 * @returns {object} Only changed properties with their new values
 */
const getUpdatedProperties = (compMod, properties) =>
	properties.reduce((acc, property) => {
		const propCompMod = compMod[property] || {};
		if (compareProperties(propCompMod) && propCompMod.new !== undefined) {
			acc[property] = propCompMod.new;
		}
		return acc;
	}, {});

module.exports = {
	setTab,
	hasType,
	checkAllKeysDeactivated,
	checkIsKeyActivated,
	divideIntoActivatedAndDeactivated,
	commentIfDeactivated,
	wrapInQuotes,
	wrapInSingleQuotes,
	removeAllQuotes,
	getNamePrefixedWithSchemaName,
	getColumnsList,
	toArray,
	getFullCollectionName,
	getEntityName,
	getSchemaOfAlterCollection,
	getSchemaOfAlterView,
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getSchemaNameFromCollection,
	getUpdatedProperties,
	checkFieldPropertiesChanged,
};
