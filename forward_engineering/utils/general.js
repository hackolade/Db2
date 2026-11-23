const { toLower, omit, isEqual, trim } = require('lodash');
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

const getAlterEntityName = entityData => {
	return entityData?.compMod?.collectionName?.new;
};

const getEntityName = entityData => {
	return entityData?.code || entityData?.collectionName || entityData?.name || '';
};

const getSchemaNameFromCollection = ({ collection }) => {
	return collection.compMod?.keyspaceName;
};

const getFullCollectionName = ({ collectionSchema, preferAlterName = true }) => {
	let name = '';

	if (preferAlterName) {
		name = getAlterEntityName(collectionSchema);
	}

	name = name || getEntityName(collectionSchema);

	const schemaName = getSchemaNameFromCollection({ collection: collectionSchema });
	return getNamePrefixedWithSchemaName({ name, schemaName });
};

const getSchemaOfAlterCollection = collection => {
	return { ...collection, ...(omit(collection?.role, 'properties') || {}) };
};

const isObjectInDeltaModelActivated = modelObject => {
	return modelObject.compMod?.isActivated?.new ?? modelObject.role?.isActivated ?? true;
};

const isParentContainerActivated = collection => {
	return (
		collection?.compMod?.bucketProperties?.isActivated ??
		collection?.role?.compMod?.bucketProperties?.isActivated ??
		true
	);
};

/**
 * @param {Object} view
 * @returns {Record<string, Object>}
 */
const getCollectionRefsDefinitionsMap = view =>
	view.compMod?.collectionData?.collectionRefsDefinitionsMap ||
	view.role?.compMod?.collectionData?.collectionRefsDefinitionsMap ||
	{};

/**
 * Resolve source table/schema/field refs for a view column.
 *
 * @param {Object} column
 * @param {Record<string, Object>} [collectionRefsDefinitionsMap]
 * @returns {Object}
 */
const getViewColumnSource = (column, collectionRefsDefinitionsMap = {}) =>
	collectionRefsDefinitionsMap[column?.refId] ||
	Object.values(collectionRefsDefinitionsMap).find(
		item => item.definitionId === column?.GUID || item.definitionId === column?.ref,
	) ||
	{};

/**
 * Shared source activation for CREATE VIEW (hydrateViewColumn) and view activation.
 * Accepts either map source `{ collection, bucket, definition }` or hydrate payload
 * `{ entityData, containerData, definition }`.
 *
 * @param {Object} [source]
 * @returns {boolean}
 */
const isViewColumnSourceActivated = (source = {}) => {
	const sourceCollection = source.collection?.[0] ?? source.entityData?.[0] ?? {};
	const sourceBucket = source.bucket?.[0] ?? source.containerData?.[0] ?? {};
	const sourceDefinition = source.definition ?? {};

	return (
		sourceCollection.isActivated !== false &&
		sourceBucket.isActivated !== false &&
		sourceDefinition.isActivated !== false
	);
};

/**
 * A view column is active only when it, its source table/schema, and its source field are active.
 *
 * @param {Object} column
 * @param {Record<string, Object>} [collectionRefsDefinitionsMap]
 * @returns {boolean}
 */
const isViewColumnActivated = (column, collectionRefsDefinitionsMap = {}) => {
	if (column?.isActivated === false) {
		return false;
	}

	return isViewColumnSourceActivated(getViewColumnSource(column, collectionRefsDefinitionsMap));
};

/**
 * Whether view DDL (CREATE VIEW, COMMENT ON VIEW, other ALTER VIEW) should stay uncommented.
 * Checks: parent container, view, and custom SELECT or at least one active view column
 * (including source collection/schema/field). Also accepts hydrated `keys` from CREATE VIEW.
 *
 * @param {Object} [view]
 * @param {Object} [options]
 * @param {boolean} [options.isActivated] Explicit view-level flag (CREATE FE third arg)
 * @param {boolean} [options.isContainerActivated] Explicit container flag
 * @param {Record<string, Object>} [options.collectionRefsDefinitionsMap] Explicit source map (CREATE FE)
 * @returns {boolean}
 */
const isViewActivated = (
	view = {},
	{ isActivated, isContainerActivated, collectionRefsDefinitionsMap: refsMap } = {},
) => {
	const containerActivated = isContainerActivated ?? isParentContainerActivated(view);
	if (containerActivated === false) {
		return false;
	}

	const viewActivated =
		isActivated ?? view.compMod?.isActivated?.new ?? view.role?.isActivated ?? view.isActivated ?? true;
	if (viewActivated === false) {
		return false;
	}

	const selectStatement = view.selectStatement ?? view.role?.selectStatement ?? '';
	if (trim(selectStatement)) {
		return true;
	}

	const collectionRefsDefinitionsMap = refsMap || getCollectionRefsDefinitionsMap(view);
	const columns = Object.values(view.properties || view.role?.properties || {});
	if (columns.length) {
		return columns.some(column => isViewColumnActivated(column, collectionRefsDefinitionsMap));
	}

	if (Array.isArray(view.keys) && view.keys.length) {
		return view.keys.some(key => key.isActivated !== false);
	}

	return true;
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
	isObjectInDeltaModelActivated,
	isParentContainerActivated,
	getCollectionRefsDefinitionsMap,
	getViewColumnSource,
	isViewColumnSourceActivated,
	isViewColumnActivated,
	isViewActivated,
	getSchemaNameFromCollection,
	getUpdatedProperties,
	checkFieldPropertiesChanged,
};
