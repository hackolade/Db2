const { omitBy, isNil, isEmpty, trim } = require('lodash');
const { wrapInQuotes, commentIfDeactivated, checkIsKeyActivated } = require('../../../utils/general');

/**
 * @enum {string}
 */
const KEY_TYPE = {
	primaryKey: 'PRIMARY KEY',
	unique: 'UNIQUE',
};

const mapProperties = (jsonSchema, iteratee) => {
	return Object.entries(jsonSchema.properties).map(iteratee);
};

/**
 * @param {{ column: object }}
 * @returns {boolean}
 */
const isUniqueKey = ({ column }) => {
	return !column.compositeUniqueKey && column.unique;
};

/**
 * @param {{ column: object }}
 * @returns {boolean}
 */
const isInlineUnique = ({ column }) => {
	return isUniqueKey({ column }) && !column.uniqueKeyOptions?.constraintName;
};
/**
 * @param {{ column: object }}
 * @returns {boolean}
 */
const isPrimaryKey = ({ column }) => {
	return !column.compositeUniqueKey && !column.compositePrimaryKey && column.primaryKey;
};

/**
 * @param {{ column: object }}
 * @returns {boolean}
 */
const isInlinePrimaryKey = ({ column }) => {
	return isPrimaryKey({ column }) && !column.primaryKeyOptions?.constraintName;
};

/**
 * @param {{ columnName?: string, isActivated?: boolean, options: object, keyType: KEY_TYPE}}
 * @returns {object}
 */
const hydrateKeyOptions = ({ columnName, isActivated, options, keyType }) => {
	return {
		keyType,
		columns: [
			{
				name: columnName,
				isActivated: isActivated,
			},
		],
		...omitBy(options, isNil),
	};
};

/**
 * @param {{ keyId: string, properties: object }}
 * @returns {string|undefined}
 */
const findName = ({ keyId, properties }) => {
	return Object.keys(properties).find(name => properties[name].GUID === keyId);
};

/**
 * @param {{keyId: string, properties: object }}
 * @returns {boolean}
 */
const checkIfActivated = ({ keyId, properties }) => {
	const key = Object.values(properties).find(prop => prop.GUID === keyId);

	return key?.isActivated ?? true;
};

/**
 * @param {{ jsonSchema: object, keys?: object[] }}
 * @returns {{ name: string, isActivated: boolean }}
 */
const getKeys = ({ jsonSchema, keys = [] }) => {
	return keys.map(key => {
		const name = findName({ keyId: key.keyId, properties: jsonSchema.properties });
		const isActivated = checkIfActivated({ keyId: key.keyId, properties: jsonSchema.properties });

		return {
			name,
			isActivated,
		};
	});
};

/**
 * @param {{ jsonSchema: object }}
 * @returns {object}
 */
const getCompositePrimaryKeys = ({ jsonSchema }) => {
	if (!Array.isArray(jsonSchema.primaryKey)) {
		return [];
	}

	return jsonSchema.primaryKey
		.filter(primaryKey => !isEmpty(primaryKey.compositePrimaryKey))
		.map(primaryKey => ({
			...hydrateKeyOptions({ options: primaryKey, keyType: KEY_TYPE.primaryKey }),
			columns: getKeys({ keys: primaryKey.compositePrimaryKey, jsonSchema }),
		}));
};

/**
 * @param {{ jsonSchema: object }}
 * @returns {object}
 */
const getCompositeUniqueKeys = ({ jsonSchema }) => {
	if (!Array.isArray(jsonSchema.uniqueKey)) {
		return [];
	}

	return jsonSchema.uniqueKey
		.filter(uniqueKey => !isEmpty(uniqueKey.compositeUniqueKey))
		.map(uniqueKey => ({
			...hydrateKeyOptions({ options: uniqueKey, keyType: KEY_TYPE.unique }),
			columns: getKeys({ keys: uniqueKey.compositeUniqueKey, jsonSchema }),
		}));
};

/**
 * @param {{ jsonSchema: object }}
 * @returns {object[]}
 */
const getTableKeyConstraints = ({ jsonSchema }) => {
	if (!jsonSchema.properties) {
		return [];
	}

	const uniqueConstraints = mapProperties(jsonSchema, ([name, column]) => {
		if (!isUniqueKey({ column }) || isInlineUnique({ column })) {
			return;
		}
		return hydrateKeyOptions({
			columnName: name,
			isActivated: column.isActivated,
			options: column.uniqueKeyOptions,
			keyType: KEY_TYPE.unique,
		});
	}).filter(Boolean);

	const primaryKeyConstraints = mapProperties(jsonSchema, ([name, column]) => {
		if (!isPrimaryKey({ column }) || isInlinePrimaryKey({ column })) {
			return;
		}
		return hydrateKeyOptions({
			columnName: name,
			isActivated: column.isActivated,
			options: column.primaryKeyOptions,
			keyType: KEY_TYPE.primaryKey,
		});
	}).filter(Boolean);

	return [
		...primaryKeyConstraints,
		...getCompositePrimaryKeys({ jsonSchema }),
		...uniqueConstraints,
		...getCompositeUniqueKeys({ jsonSchema }),
	];
};

/**
 * @param {{ keys: object[] }}
 * @returns {string}
 */
const foreignKeysToString = ({ keys }) => {
	if (Array.isArray(keys)) {
		const activatedKeys = keys.filter(key => checkIsKeyActivated({ key })).map(key => wrapInQuotes(trim(key.name)));
		const deactivatedKeys = keys
			.filter(key => !checkIsKeyActivated({ key }))
			.map(key => wrapInQuotes(trim(key.name)));
		const deactivatedKeysAsString = deactivatedKeys.length
			? commentIfDeactivated(deactivatedKeys, { isActivated: false, isPartOfLine: true })
			: '';

		return activatedKeys.join(', ') + deactivatedKeysAsString;
	}
	return keys;
};

/**
 * @param {{ keys: object[] }}
 * @returns {string}
 */
const foreignActiveKeysToString = ({ keys }) => {
	return keys.map(key => trim(key.name)).join(', ');
};

/**
 * @param {{ customProperties?: object }}
 * @returns {string}
 */
const customPropertiesForForeignKey = ({ customProperties }) => {
	const relationshipOnDelete = customProperties?.relationshipOnDelete;

	return relationshipOnDelete ? ' ON DELETE ' + relationshipOnDelete : '';
};

module.exports = {
	getTableKeyConstraints,
	isInlineUnique,
	isInlinePrimaryKey,
	foreignKeysToString,
	foreignActiveKeysToString,
	customPropertiesForForeignKey,
};
