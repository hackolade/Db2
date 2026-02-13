const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { UniqueKeyTransitionDto, KeyScriptModificationDto } = require('../../types/AlterKeyDto');
const { alterUkConstraint, dropUkConstraint } = require('../../../ddlProvider/ddlHelpers/key/constraintsHelper');
const {
	getFullCollectionName,
	getSchemaOfAlterCollection,
	getEntityName,
	wrapInQuotes,
	isParentContainerActivated,
	isObjectInDeltaModelActivated,
} = require('../../../utils/general');
const { CONSTRAINT_POSTFIX } = require('../../../../constants/constants');
const { KEY_TYPE } = require('../../../ddlProvider/ddlHelpers/key/keyHelper');

const amountOfColumnsInRegularUniqueKey = 1;

const getDefaultConstraintName = entityName => {
	return [entityName, CONSTRAINT_POSTFIX.uniqueKey].join('_');
};

const extractOptionsForComparisonWithRegularUniqueKeyOptions = optionHolder => {
	return {
		constraintName: optionHolder.constraintName,
		deferClause: optionHolder.deferClause,
		exceptionClause: optionHolder.exceptionClause,
		id: optionHolder.id,
		indexClause: optionHolder.indexClause,
		rely: optionHolder.rely,
		validate: optionHolder.validate,
	};
};

const getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions = columnJsonSchema => {
	return extractOptionsForComparisonWithRegularUniqueKeyOptions(columnJsonSchema.uniqueKeyOptions || {});
};

const getCustomPropertiesOfCompositeUniqueKeyForComparisonWithRegularUniqueKeyOptions = compositeUniqueKey => {
	const optionsForComparison = extractOptionsForComparisonWithRegularUniqueKeyOptions(compositeUniqueKey);
	return optionsForComparison;
};

const wasCompositeUniqueKeyChangedInTransitionFromCompositeToRegular = collection => {
	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const oldUniqueKeys = uniqueDto.old || [];
	const idsOfColumns = oldUniqueKeys.flatMap(unique => unique.compositeUniqueKey?.map(dto => dto.keyId) || []);
	if (idsOfColumns.length !== amountOfColumnsInRegularUniqueKey) {
		// We return false, because it wouldn't count as transition between regular UniqueKey and composite UniqueKey
		// if composite UniqueKey did not constraint exactly 1 column
		return UniqueKeyTransitionDto.noTransition();
	}
	const idOfUniqueKeyColumn = idsOfColumns[0];
	const newColumnJsonSchema = Object.values(collection.role.properties).find(
		columnJsonSchema => columnJsonSchema.GUID === idOfUniqueKeyColumn,
	);
	if (!newColumnJsonSchema) {
		return UniqueKeyTransitionDto.noTransition();
	}
	const isNewColumnARegularUniqueKey = newColumnJsonSchema?.unique && !newColumnJsonSchema?.compositeUniqueKey;
	if (!isNewColumnARegularUniqueKey) {
		return UniqueKeyTransitionDto.noTransition();
	}
	const constraintOptions =
		getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(newColumnJsonSchema);
	const areOptionsEqual = oldUniqueKeys.some(compositeUniqueKey => {
		if (compositeUniqueKey.compositeUniqueKey?.length !== amountOfColumnsInRegularUniqueKey) {
			return false;
		}
		const oldCompositeUniqueKeyAsRegularUniqueKeyOptions =
			getCustomPropertiesOfCompositeUniqueKeyForComparisonWithRegularUniqueKeyOptions(compositeUniqueKey);

		return _.isEqual(oldCompositeUniqueKeyAsRegularUniqueKeyOptions, constraintOptions);
	});

	return UniqueKeyTransitionDto.transition(!areOptionsEqual);
};

const wasCompositeUniqueKeyChangedInTransitionFromRegularToComposite = collection => {
	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const newUniqueKeys = uniqueDto.new || [];
	const idsOfColumns = newUniqueKeys.flatMap(unique => unique.compositeUniqueKey?.map(dto => dto.keyId) || []);
	if (idsOfColumns.length !== amountOfColumnsInRegularUniqueKey) {
		// We return false, because it wouldn't count as transition between regular UniqueKey and composite UniqueKey
		// if composite UniqueKey does not constraint exactly 1 column
		return UniqueKeyTransitionDto.noTransition();
	}
	const idOfUniqueKeyColumn = idsOfColumns[0];
	const oldColumnJsonSchema = Object.values(collection.role.properties).find(
		columnJsonSchema => columnJsonSchema.GUID === idOfUniqueKeyColumn,
	);
	if (!oldColumnJsonSchema) {
		return UniqueKeyTransitionDto.noTransition();
	}
	const isOldColumnARegularUniqueKey = oldColumnJsonSchema?.unique && !oldColumnJsonSchema?.compositeUniqueKey;
	if (!isOldColumnARegularUniqueKey) {
		return UniqueKeyTransitionDto.noTransition();
	}
	const constraintOptions =
		getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(oldColumnJsonSchema);
	const areOptionsEqual = newUniqueKeys.some(compositeUniqueKey => {
		if (compositeUniqueKey.compositeUniqueKey?.length !== amountOfColumnsInRegularUniqueKey) {
			return false;
		}
		const oldCompositeUniqueKeyAsRegularUniqueKeyOptions =
			getCustomPropertiesOfCompositeUniqueKeyForComparisonWithRegularUniqueKeyOptions(compositeUniqueKey);

		return _.isEqual(oldCompositeUniqueKeyAsRegularUniqueKeyOptions, constraintOptions);
	});

	return UniqueKeyTransitionDto.transition(!areOptionsEqual);
};

const getConstraintNameForCompositeUniqueKey = (uniqueKey, entityName) => {
	if (uniqueKey.constraintName) {
		return uniqueKey.constraintName;
	}
	return getDefaultConstraintName(entityName);
};

const getCreateCompositeUniqueKeyDDLProviderConfig = (uniqueKey, entityName, entity) => {
	const constraintName = getConstraintNameForCompositeUniqueKey(uniqueKey, entityName);
	const pkColumns = _.toPairs(entity.role.properties)
		.filter(([name, jsonSchema]) =>
			Boolean(uniqueKey.compositeUniqueKey?.find(keyDto => keyDto.keyId === jsonSchema.GUID)),
		)
		.map(([name, jsonSchema]) => ({
			name,
			isActivated: jsonSchema.isActivated,
		}));

	return {
		keyType: KEY_TYPE.uniqueKey,
		name: constraintName,
		columns: pkColumns,
	};
};

const getAddCompositeUniqueKeyScriptDtos = collection => {
	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const newUniqueKeys = uniqueDto.new || [];
	const oldUniqueKeys = uniqueDto.old || [];
	if (newUniqueKeys.length === 0 && oldUniqueKeys.length === 0) {
		return [];
	}
	const transitionToCompositeDto = wasCompositeUniqueKeyChangedInTransitionFromRegularToComposite(collection);
	if (transitionToCompositeDto.didTransitionHappen && !transitionToCompositeDto.wasUniqueKeyChangedInTransition) {
		return [];
	}
	if (newUniqueKeys.length === oldUniqueKeys.length) {
		const areKeyArraysEqual = _(oldUniqueKeys).differenceWith(newUniqueKeys, _.isEqual).isEmpty();
		if (areKeyArraysEqual) {
			return [];
		}
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return newUniqueKeys
		.map(newUniqueKey => {
			const ddlConfig = getCreateCompositeUniqueKeyDDLProviderConfig(newUniqueKey, entityName, collection);
			if (_.isEmpty(ddlConfig.columns)) {
				return null;
			}
			const statementDto = alterUkConstraint(fullTableName, isCollectionActivated, ddlConfig);
			return new KeyScriptModificationDto(statementDto.statement, fullTableName, false, statementDto.isActivated);
		})
		.filter(scriptDto => Boolean(scriptDto?.script));
};

const getDropCompositeUniqueKeyScriptDtos = collection => {
	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const newUniqueKeys = uniqueDto.new || [];
	const oldUniqueKeys = uniqueDto.old || [];
	if (newUniqueKeys.length === 0 && oldUniqueKeys.length === 0) {
		return [];
	}
	const transitionToCompositeDto = wasCompositeUniqueKeyChangedInTransitionFromCompositeToRegular(collection);
	if (transitionToCompositeDto.didTransitionHappen && !transitionToCompositeDto.wasUniqueKeyChangedInTransition) {
		return [];
	}
	if (newUniqueKeys.length === oldUniqueKeys.length) {
		const areKeyArraysEqual = _(oldUniqueKeys).differenceWith(newUniqueKeys, _.isEqual).isEmpty();
		if (areKeyArraysEqual) {
			return [];
		}
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return oldUniqueKeys
		.map(oldUniqueKey => {
			let constraintName = getDefaultConstraintName(entityName);
			if (oldUniqueKey.constraintName) {
				constraintName = oldUniqueKey.constraintName;
			}
			const ddlConstraintName = wrapInQuotes(constraintName);
			const script = dropUkConstraint(fullTableName, ddlConstraintName);
			return new KeyScriptModificationDto(script, fullTableName, true, isCollectionActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getModifyCompositeUniqueKeyScriptDtos = collection => {
	const dropCompositeUniqueKeyScriptDtos = getDropCompositeUniqueKeyScriptDtos(collection);
	const addCompositeUniqueKeyScriptDtos = getAddCompositeUniqueKeyScriptDtos(collection);

	return [...dropCompositeUniqueKeyScriptDtos, ...addCompositeUniqueKeyScriptDtos].filter(Boolean);
};

const getConstraintNameForRegularUniqueKey = (columnJsonSchema, entityName) => {
	const constraintOptions = columnJsonSchema.uniqueKeyOptions;
	if (constraintOptions?.constraintName?.trim()) {
		return constraintOptions.constraintName;
	}
	return getDefaultConstraintName(entityName);
};

const getCreateRegularUniqueKeyDDLProviderConfig = (columnName, columnJsonSchema, entityName, entity) => {
	const constraintName = getConstraintNameForRegularUniqueKey(columnJsonSchema, entityName);
	const ukColumns = [
		{
			name: columnName,
			isActivated: columnJsonSchema.isActivated,
		},
	];

	return {
		keyType: KEY_TYPE.uniqueKey,
		name: constraintName,
		columns: ukColumns,
		options: columnJsonSchema.uniqueKeyOptions,
	};
};

const wasFieldChangedToBeARegularUniqueKey = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const isRegularUniqueKey = columnJsonSchema.unique && !columnJsonSchema.compositeUniqueKey;
	const wasTheFieldAnyUniqueKey = oldColumnJsonSchema?.unique || oldColumnJsonSchema.compositeUniqueKey;

	return isRegularUniqueKey && !wasTheFieldAnyUniqueKey;
};

const wasRegularUniqueKeyChangedInTransitionFromCompositeToRegular = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const isRegularUniqueKey = columnJsonSchema.unique && !columnJsonSchema.compositeUniqueKey;
	const wasTheFieldAnyUniqueKey = oldColumnJsonSchema?.unique || oldColumnJsonSchema.compositeUniqueKey;

	if (!(isRegularUniqueKey && wasTheFieldAnyUniqueKey)) {
		return UniqueKeyTransitionDto.noTransition();
	}

	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const newUniqueKeys = uniqueDto.new || [];

	const oldUniqueKeys = uniqueDto.old || [];
	const wasTheFieldACompositeUniqueKey = oldUniqueKeys.some(compUniqueKey =>
		compUniqueKey.compositeUniqueKey?.some(unique => unique.keyId === oldColumnJsonSchema.GUID),
	);
	const isTheFieldACompositeUniqueKey = newUniqueKeys.some(compUniqueKey =>
		compUniqueKey.compositeUniqueKey?.some(unique => unique.keyId === columnJsonSchema.GUID),
	);

	const wasCompositeUniqueKeyRemoved = wasTheFieldACompositeUniqueKey && !isTheFieldACompositeUniqueKey;

	if (isRegularUniqueKey && wasCompositeUniqueKeyRemoved) {
		// return compare custom properties and amount of columns.
		// If there was a transition and amount of composite UniqueKey columns is not equal
		// to amount of regular unique columns, we must recreate UniqueKey
		const constraintOptions =
			getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(columnJsonSchema);
		const areOptionsEqual = oldUniqueKeys.some(oldCompositeUniqueKey => {
			if (oldCompositeUniqueKey.compositeUniqueKey?.length !== amountOfColumnsInRegularUniqueKey) {
				return false;
			}
			const oldCompositeUniqueKeyAsRegularUniqueKeyOptions =
				getCustomPropertiesOfCompositeUniqueKeyForComparisonWithRegularUniqueKeyOptions(oldCompositeUniqueKey);

			return _.isEqual(oldCompositeUniqueKeyAsRegularUniqueKeyOptions, constraintOptions);
		});
		return UniqueKeyTransitionDto.transition(!areOptionsEqual);
	}

	return UniqueKeyTransitionDto.noTransition();
};

const wasRegularUniqueKeyChangedInTransitionFromRegularToComposite = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const wasRegularUniqueKey = oldColumnJsonSchema.unique && !oldColumnJsonSchema.compositeUniqueKey;
	const isTheFieldAnyUniqueKey = Boolean(columnJsonSchema?.unique);

	if (!(wasRegularUniqueKey && isTheFieldAnyUniqueKey)) {
		return UniqueKeyTransitionDto.noTransition();
	}

	const uniqueDto = collection?.role?.compMod?.uniqueKey || {};
	const newUniqueKeys = uniqueDto.new || [];

	const oldUniqueKeys = uniqueDto.old || [];
	const wasTheFieldACompositeUniqueKey = oldUniqueKeys.some(compUniqueKey =>
		compUniqueKey.compositeUniqueKey?.some(unique => unique.keyId === oldColumnJsonSchema.GUID),
	);
	const isTheFieldACompositeUniqueKey = newUniqueKeys.some(compUniqueKey =>
		compUniqueKey.compositeUniqueKey?.some(unique => unique.keyId === columnJsonSchema.GUID),
	);

	const wasCompositeUniqueKeyAdded = isTheFieldACompositeUniqueKey && !wasTheFieldACompositeUniqueKey;

	if (wasRegularUniqueKey && wasCompositeUniqueKeyAdded) {
		// return compare custom properties and amount of columns.
		// If there was a transition and amount of composite UniqueKey columns is not equal
		// to amount of regular unique columns, we must recreate UniqueKey
		const constraintOptions =
			getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(oldColumnJsonSchema);
		const areOptionsEqual = newUniqueKeys.some(oldCompositeUniqueKey => {
			if (oldCompositeUniqueKey.compositeUniqueKey?.length !== amountOfColumnsInRegularUniqueKey) {
				return false;
			}
			const oldCompositeUniqueKeyAsRegularUniqueKeyOptions =
				getCustomPropertiesOfCompositeUniqueKeyForComparisonWithRegularUniqueKeyOptions(oldCompositeUniqueKey);

			return _.isEqual(oldCompositeUniqueKeyAsRegularUniqueKeyOptions, constraintOptions);
		});

		return UniqueKeyTransitionDto.transition(!areOptionsEqual);
	}

	return UniqueKeyTransitionDto.noTransition();
};

const isFieldNoLongerARegularUniqueKey = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;

	const oldJsonSchema = collection.role.properties[oldName];
	const wasTheFieldARegularUniqueKey = oldJsonSchema?.unique && !oldJsonSchema?.compositeUniqueKey;

	const isNotAnyUniqueKey = !columnJsonSchema.unique && !columnJsonSchema.compositeUniqueKey;
	return wasTheFieldARegularUniqueKey && isNotAnyUniqueKey;
};

const wasRegularUniqueKeyModified = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldJsonSchema = collection.role.properties[oldName] || {};

	const isRegularUniqueKey = columnJsonSchema.unique && !columnJsonSchema.compositeUniqueKey;
	const wasTheFieldARegularUniqueKey = oldJsonSchema?.unique && !oldJsonSchema?.compositeUniqueKey;

	if (!(isRegularUniqueKey && wasTheFieldARegularUniqueKey)) {
		return false;
	}
	const constraintOptions =
		getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(columnJsonSchema);
	const oldConstraintOptions =
		getCustomPropertiesOfRegularUniqueKeyForComparisonWithRegularUniqueKeyOptions(oldJsonSchema);

	return !_.isEqual(oldConstraintOptions, constraintOptions);
};

const getAddUniqueKeyScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			if (wasFieldChangedToBeARegularUniqueKey(jsonSchema, collection)) {
				return true;
			}
			const transitionToRegularDto = wasRegularUniqueKeyChangedInTransitionFromCompositeToRegular(
				jsonSchema,
				collection,
			);
			if (transitionToRegularDto.didTransitionHappen) {
				return transitionToRegularDto.wasUniqueKeyChangedInTransition;
			}
			return wasRegularUniqueKeyModified(jsonSchema, collection);
		})
		.map(([name, jsonSchema]) => {
			const ddlConfig = getCreateRegularUniqueKeyDDLProviderConfig(name, jsonSchema, entityName, collection);
			const statementDto = alterUkConstraint(fullTableName, isCollectionActivated, ddlConfig);
			return new KeyScriptModificationDto(statementDto.statement, fullTableName, false, statementDto.isActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getDropUniqueKeyScriptDto = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName({ collectionSchema });
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			if (isFieldNoLongerARegularUniqueKey(jsonSchema, collection)) {
				return true;
			}
			const transitionToRegularDto = wasRegularUniqueKeyChangedInTransitionFromRegularToComposite(
				jsonSchema,
				collection,
			);
			if (transitionToRegularDto.didTransitionHappen) {
				return transitionToRegularDto.wasUniqueKeyChangedInTransition;
			}
			return wasRegularUniqueKeyModified(jsonSchema, collection);
		})
		.map(([name, jsonSchema]) => {
			const oldName = jsonSchema.compMod.oldField.name;
			const oldJsonSchema = collection.role.properties[oldName];
			const ddlConstraintName = wrapInQuotes(getConstraintNameForRegularUniqueKey(oldJsonSchema, entityName));

			const script = dropUkConstraint(fullTableName, ddlConstraintName);
			return new KeyScriptModificationDto(script, fullTableName, true, isCollectionActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getModifyUniqueKeyScriptDtos = collection => {
	const dropUniqueKeyScriptDtos = getDropUniqueKeyScriptDto(collection);
	const addUniqueKeyScriptDtos = getAddUniqueKeyScriptDtos(collection);

	return [...dropUniqueKeyScriptDtos, ...addUniqueKeyScriptDtos].filter(Boolean);
};

const sortModifyUniqueKeyConstraints = constraintDtos => {
	return constraintDtos.sort((c1, c2) => {
		if (c1.fullTableName === c2.fullTableName) {
			// Number(true) = 1, Number(false) = 0;
			// This ensures that DROP script appears before CREATE script
			// if the same table has 2 scripts that drop and recreate UniqueKey
			return Number(c2.isDropScript) - Number(c1.isDropScript);
		}
		// This sorts all statements based on full table name, ASC
		return c1.fullTableName.localeCompare(c2.fullTableName);
	});
};

const getModifyUkConstraintsScriptDtos = collection => {
	const modifyCompositeUniqueKeyScriptDtos = getModifyCompositeUniqueKeyScriptDtos(collection);
	const modifyUniqueKeyScriptDtos = getModifyUniqueKeyScriptDtos(collection);

	const allDtos = [...modifyCompositeUniqueKeyScriptDtos, ...modifyUniqueKeyScriptDtos];
	const sortedAllDtos = sortModifyUniqueKeyConstraints(allDtos);

	return sortedAllDtos
		.map(dto => {
			return AlterScriptDto.getInstance([dto.script], dto.isActivated, dto.isDropScript);
		})
		.filter(Boolean);
};

module.exports = {
	getModifyUkConstraintsScriptDtos,
};
