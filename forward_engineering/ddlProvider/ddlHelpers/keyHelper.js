const _ = require('lodash');
const { clean, wrapInQuotes, commentIfDeactivated } = require('../../utils/general');

const mapProperties = (jsonSchema, iteratee) => {
	return Object.entries(jsonSchema.properties).map(iteratee);
};

const isUniqueKey = column => {
	if (column.compositeUniqueKey) {
		return false;
	} else if (!column.unique) {
		return false;
	} else {
		return true;
	}
};

const isInlineUnique = column => {
	return isUniqueKey(column) && !column.uniqueKeyOptions?.constraintName;
};

const isPrimaryKey = column => {
	if (column.compositeUniqueKey) {
		return false;
	} else if (column.compositePrimaryKey) {
		return false;
	} else if (!column.primaryKey) {
		return false;
	} else {
		return true;
	}
};

const isInlinePrimaryKey = column => {
	return isPrimaryKey(column) && !column.primaryKeyOptions?.constraintName;
};

const hydrateUniqueOptions = (options, columnName, isActivated) =>
	clean({
		keyType: 'UNIQUE',
		columns: [
			{
				name: columnName,
				isActivated: isActivated,
			},
		],
		...options,
	});

const hydratePrimaryKeyOptions = (options, columnName, isActivated) =>
	clean({
		keyType: 'PRIMARY KEY',
		columns: [
			{
				name: columnName,
				isActivated: isActivated,
			},
		],
		...options,
	});

const findName = (keyId, properties) => {
	return Object.keys(properties).find(name => properties[name].GUID === keyId);
};

const checkIfActivated = (keyId, properties) => {
	return _.get(
		Object.values(properties).find(prop => prop.GUID === keyId),
		'isActivated',
		true,
	);
};

const getKeys = (keys, jsonSchema) => {
	return _.map(keys, key => {
		return {
			name: findName(key.keyId, jsonSchema.properties),
			isActivated: checkIfActivated(key.keyId, jsonSchema.properties),
		};
	});
};

const getCompositePrimaryKeys = jsonSchema => {
	if (!Array.isArray(jsonSchema.primaryKey)) {
		return [];
	}

	return jsonSchema.primaryKey
		.filter(primaryKey => !_.isEmpty(primaryKey.compositePrimaryKey))
		.map(primaryKey => ({
			...hydratePrimaryKeyOptions(primaryKey, null, null, jsonSchema),
			columns: getKeys(primaryKey.compositePrimaryKey, jsonSchema),
		}));
};

const getCompositeUniqueKeys = jsonSchema => {
	if (!Array.isArray(jsonSchema.uniqueKey)) {
		return [];
	}

	return jsonSchema.uniqueKey
		.filter(uniqueKey => !_.isEmpty(uniqueKey.compositeUniqueKey))
		.map(uniqueKey => ({
			...hydrateUniqueOptions(uniqueKey, null, null, jsonSchema),
			columns: getKeys(uniqueKey.compositeUniqueKey, jsonSchema),
		}));
};

const getTableKeyConstraints = jsonSchema => {
	if (!jsonSchema.properties) {
		return [];
	}

	const uniqueConstraints = mapProperties(jsonSchema, ([name, columnSchema]) => {
		if (!isUniqueKey(columnSchema) || isInlineUnique(columnSchema)) {
			return;
		} else {
			return hydrateUniqueOptions(columnSchema.uniqueKeyOptions, name, columnSchema.isActivated);
		}
	}).filter(Boolean);

	const primaryKeyConstraints = mapProperties(jsonSchema, ([name, columnSchema]) => {
		if (!isPrimaryKey(columnSchema) || isInlinePrimaryKey(columnSchema)) {
			return;
		} else {
			return hydratePrimaryKeyOptions(columnSchema.primaryKeyOptions, name, columnSchema.isActivated);
		}
	}).filter(Boolean);

	return [
		...primaryKeyConstraints,
		...getCompositePrimaryKeys(jsonSchema),
		...uniqueConstraints,
		...getCompositeUniqueKeys(jsonSchema),
	];
};

const foreignKeysToString = keys => {
	if (Array.isArray(keys)) {
		const activatedKeys = keys
			.filter(key => _.get(key, 'isActivated', true))
			.map(key => wrapInQuotes(_.trim(key.name)));
		const deactivatedKeys = keys
			.filter(key => !_.get(key, 'isActivated', true))
			.map(key => wrapInQuotes(_.trim(key.name)));
		const deactivatedKeysAsString = deactivatedKeys.length
			? commentIfDeactivated(deactivatedKeys, { isActivated: false, isPartOfLine: true })
			: '';

		return activatedKeys.join(', ') + deactivatedKeysAsString;
	}
	return keys;
};

const foreignActiveKeysToString = keys => {
	return keys.map(key => _.trim(key.name)).join(', ');
};

const customPropertiesForForeignKey = ({ customProperties }) => {
	const relationshipOnDelete = customProperties?.relationshipOnDelete;

	return relationshipOnDelete ? ' ON DELETE ' + relationshipOnDelete : '';
};

module.exports = {
	getTableKeyConstraints,
	isInlineUnique,
	isInlinePrimaryKey,
	getKeys,
	foreignKeysToString,
	foreignActiveKeysToString,
	customPropertiesForForeignKey,
};
