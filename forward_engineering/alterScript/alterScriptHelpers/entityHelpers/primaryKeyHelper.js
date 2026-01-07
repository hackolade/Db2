const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const { PrimaryKeyTransitionDto, KeyScriptModificationDto } = require('../../types/AlterKeyDto');
const {
	getFullCollectionName,
	getSchemaOfAlterCollection,
	getEntityName,
	wrapInQuotes,
	isParentContainerActivated,
	isObjectInDeltaModelActivated,
} = require('../../../utils/general');
const { alterPkConstraint, dropPK } = require('../../../ddlProvider/ddlHelpers/key/constraintsHelper');
const { KEY_TYPE } = require('../../../ddlProvider/ddlHelpers/key/keyHelper');

const amountOfColumnsInRegularPk = 1;

const getDefaultConstraintName = entityName => {
	return `${entityName}_pkey`;
};

const extractOptionsForComparisonWithRegularPkOptions = (optionHolder = {}) => {
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

const getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions = columnJsonSchema => {
	return extractOptionsForComparisonWithRegularPkOptions(columnJsonSchema.primaryKeyOptions);
};

const getCustomPropertiesOfCompositePkForComparisonWithRegularPkOptions = compositePk => {
	const optionsForComparison = extractOptionsForComparisonWithRegularPkOptions(compositePk);
	return [optionsForComparison].filter(o => Object.values(o).some(Boolean));
};

const wasCompositePkChangedInTransitionFromCompositeToRegular = collection => {
	const pkDto = collection?.role?.compMod?.primaryKey || {};
	const oldPrimaryKeys = pkDto.old || [];
	const idsOfColumns = oldPrimaryKeys.flatMap(pk => pk.compositePrimaryKey?.map(dto => dto.keyId) || []);
	if (idsOfColumns.length !== amountOfColumnsInRegularPk) {
		// We return false, because it wouldn't count as transition between regular PK and composite PK
		// if composite PK did not constraint exactly 1 column
		return PrimaryKeyTransitionDto.noTransition();
	}
	const idOfPkColumn = idsOfColumns[0];
	const newColumnJsonSchema = Object.values(collection.properties).find(
		columnJsonSchema => columnJsonSchema.GUID === idOfPkColumn,
	);
	if (!newColumnJsonSchema) {
		return PrimaryKeyTransitionDto.noTransition();
	}
	const isNewColumnARegularPrimaryKey = newColumnJsonSchema?.primaryKey && !newColumnJsonSchema?.compositePrimaryKey;
	if (!isNewColumnARegularPrimaryKey) {
		return PrimaryKeyTransitionDto.noTransition();
	}
	const constraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(newColumnJsonSchema);
	const areOptionsEqual = oldPrimaryKeys.some(compositePk => {
		if (compositePk.compositePrimaryKey?.length !== amountOfColumnsInRegularPk) {
			return false;
		}
		const oldCompositePkAsRegularPkOptions =
			getCustomPropertiesOfCompositePkForComparisonWithRegularPkOptions(compositePk);

		return _.isEqual(oldCompositePkAsRegularPkOptions, constraintOptions);
	});

	return PrimaryKeyTransitionDto.transition(!areOptionsEqual);
};

const wasCompositePkChangedInTransitionFromRegularToComposite = collection => {
	/**
	 * @type {AlterCollectionRoleCompModPrimaryKey}
	 * */
	const pkDto = collection?.role?.compMod?.primaryKey || {};
	/**
	 * @type {AlterCollectionRoleCompModPKDto[]}
	 * */
	const newPrimaryKeys = pkDto.new || [];
	const idsOfColumns = newPrimaryKeys.flatMap(pk => pk.compositePrimaryKey?.map(dto => dto.keyId) || []);
	if (idsOfColumns.length !== amountOfColumnsInRegularPk) {
		// We return false, because it wouldn't count as transition between regular PK and composite PK
		// if composite PK does not constraint exactly 1 column
		return PrimaryKeyTransitionDto.noTransition();
	}
	const idOfPkColumn = idsOfColumns[0];
	const oldColumnJsonSchema = Object.values(collection.role.properties).find(
		columnJsonSchema => columnJsonSchema.GUID === idOfPkColumn,
	);
	if (!oldColumnJsonSchema) {
		return PrimaryKeyTransitionDto.noTransition();
	}
	const isOldColumnARegularPrimaryKey = oldColumnJsonSchema?.primaryKey && !oldColumnJsonSchema?.compositePrimaryKey;
	if (!isOldColumnARegularPrimaryKey) {
		return PrimaryKeyTransitionDto.noTransition();
	}
	const constraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(oldColumnJsonSchema);
	const areOptionsEqual = newPrimaryKeys.some(compositePk => {
		if (compositePk.compositePrimaryKey?.length !== amountOfColumnsInRegularPk) {
			return false;
		}
		const oldCompositePkAsRegularPkOptions =
			getCustomPropertiesOfCompositePkForComparisonWithRegularPkOptions(compositePk);

		return _.isEqual(oldCompositePkAsRegularPkOptions, constraintOptions);
	});

	return PrimaryKeyTransitionDto.transition(!areOptionsEqual);
};

const getConstraintNameForCompositePk = (primaryKey, entityName) => {
	if (primaryKey.constraintName) {
		return primaryKey.constraintName;
	}
	return getDefaultConstraintName(entityName);
};

const getCreateCompositePKDDLProviderConfig = (primaryKey, entityName, entity) => {
	const constraintName = getConstraintNameForCompositePk(primaryKey, entityName);
	const pkColumns = _.toPairs(entity.role.properties)
		.filter(([name, jsonSchema]) =>
			Boolean(primaryKey.compositePrimaryKey?.find(keyDto => keyDto.keyId === jsonSchema.GUID)),
		)
		.map(([name, jsonSchema]) => ({
			name,
			isActivated: jsonSchema.isActivated,
		}));

	return {
		keyType: KEY_TYPE.primaryKey,
		name: constraintName,
		columns: pkColumns,
	};
};

const getAddCompositePkScriptDtos = collection => {
	/**
	 * @type {AlterCollectionRoleCompModPrimaryKey}
	 * */
	const pkDto = collection?.role?.compMod?.primaryKey || {};
	const newPrimaryKeys = pkDto.new || [];
	const oldPrimaryKeys = pkDto.old || [];
	if (newPrimaryKeys.length === 0 && oldPrimaryKeys.length === 0) {
		return [];
	}
	const transitionToCompositeDto = wasCompositePkChangedInTransitionFromRegularToComposite(collection);
	if (transitionToCompositeDto.didTransitionHappen && !transitionToCompositeDto.wasPkChangedInTransition) {
		return [];
	}
	if (newPrimaryKeys.length === oldPrimaryKeys.length) {
		const areKeyArraysEqual = _(oldPrimaryKeys).differenceWith(newPrimaryKeys, _.isEqual).isEmpty();
		if (areKeyArraysEqual) {
			return [];
		}
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return newPrimaryKeys
		.map(newPk => {
			const ddlConfig = getCreateCompositePKDDLProviderConfig(newPk, entityName, collection);
			if (_.isEmpty(ddlConfig.columns)) {
				return null;
			}
			const statementDto = alterPkConstraint(fullTableName, isCollectionActivated, ddlConfig);
			return new KeyScriptModificationDto(statementDto.statement, fullTableName, false, statementDto.isActivated);
		})
		.filter(scriptDto => Boolean(scriptDto?.script));
};

const getDropCompositePkScriptDtos = collection => {
	const pkDto = collection?.role?.compMod?.primaryKey || {};
	const newPrimaryKeys = pkDto.new || [];
	const oldPrimaryKeys = pkDto.old || [];
	if (newPrimaryKeys.length === 0 && oldPrimaryKeys.length === 0) {
		return [];
	}
	const transitionToCompositeDto = wasCompositePkChangedInTransitionFromCompositeToRegular(collection);
	if (transitionToCompositeDto.didTransitionHappen && !transitionToCompositeDto.wasPkChangedInTransition) {
		return [];
	}
	if (newPrimaryKeys.length === oldPrimaryKeys.length) {
		const areKeyArraysEqual = _(oldPrimaryKeys).differenceWith(newPrimaryKeys, _.isEqual).isEmpty();
		if (areKeyArraysEqual) {
			return [];
		}
	}

	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return oldPrimaryKeys
		.map(oldPk => {
			const script = dropPK(fullTableName);
			return new KeyScriptModificationDto(script, fullTableName, true, isCollectionActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getModifyCompositePkScriptDtos = collection => {
	const dropCompositePkScriptDtos = getDropCompositePkScriptDtos(collection);
	const addCompositePkScriptDtos = getAddCompositePkScriptDtos(collection);

	return [...dropCompositePkScriptDtos, ...addCompositePkScriptDtos].filter(Boolean);
};

const getConstraintNameForRegularPk = (columnJsonSchema, entityName) => {
	const constraintOptions = columnJsonSchema.primaryKeyOptions;
	if (constraintOptions?.constraintName?.trim()) {
		return constraintOptions.constraintName;
	}
	return getDefaultConstraintName(entityName);
};

const getCreateRegularPKDDLProviderConfig = (columnName, columnJsonSchema, entityName, entity) => {
	const constraintName = getConstraintNameForRegularPk(columnJsonSchema, entityName);
	const pkColumns = [
		{
			name: columnName,
			isActivated: columnJsonSchema.isActivated,
		},
	];

	return {
		keyType: KEY_TYPE.primaryKey,
		name: constraintName,
		columns: pkColumns,
		options: columnJsonSchema.primaryKeyOptions,
	};
};

const wasFieldChangedToBeARegularPk = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const isRegularPrimaryKey = columnJsonSchema.primaryKey && !columnJsonSchema.compositePrimaryKey;
	const wasTheFieldAnyPrimaryKey = Boolean(oldColumnJsonSchema?.primaryKey);

	return isRegularPrimaryKey && !wasTheFieldAnyPrimaryKey;
};

const wasRegularPkChangedInTransitionFromCompositeToRegular = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const isRegularPrimaryKey = columnJsonSchema.primaryKey && !columnJsonSchema.compositePrimaryKey;
	const wasTheFieldAnyPrimaryKey = Boolean(oldColumnJsonSchema?.primaryKey);

	if (!(isRegularPrimaryKey && wasTheFieldAnyPrimaryKey)) {
		return PrimaryKeyTransitionDto.noTransition();
	}

	const pkDto = collection?.role?.compMod?.primaryKey || {};
	const newPrimaryKeys = pkDto.new || [];
	const oldPrimaryKeys = pkDto.old || [];
	const wasTheFieldACompositePrimaryKey = oldPrimaryKeys.some(compPk =>
		compPk.compositePrimaryKey?.some(pk => pk.keyId === oldColumnJsonSchema.GUID),
	);
	const isTheFieldACompositePrimaryKey = newPrimaryKeys.some(compPk =>
		compPk.compositePrimaryKey?.some(pk => pk.keyId === columnJsonSchema.GUID),
	);

	const wasCompositePkRemoved = wasTheFieldACompositePrimaryKey && !isTheFieldACompositePrimaryKey;

	if (isRegularPrimaryKey && wasCompositePkRemoved) {
		// return compare custom properties and amount of columns.
		// If there was a transition and amount of composite PK columns is not equal
		// to amount of regular pk columns, we must recreate PK
		const constraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(columnJsonSchema);
		const areOptionsEqual = oldPrimaryKeys.some(oldCompositePk => {
			if (oldCompositePk.compositePrimaryKey?.length !== amountOfColumnsInRegularPk) {
				return false;
			}
			const oldCompositePkAsRegularPkOptions =
				getCustomPropertiesOfCompositePkForComparisonWithRegularPkOptions(oldCompositePk);

			return _.isEqual(oldCompositePkAsRegularPkOptions, constraintOptions);
		});
		return PrimaryKeyTransitionDto.transition(!areOptionsEqual);
	}

	return PrimaryKeyTransitionDto.noTransition();
};

const wasRegularPkChangedInTransitionFromRegularToComposite = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldColumnJsonSchema = collection.role.properties[oldName];

	const wasRegularPrimaryKey = oldColumnJsonSchema.primaryKey && !oldColumnJsonSchema.compositePrimaryKey;
	const isTheFieldAnyPrimaryKey = Boolean(columnJsonSchema?.primaryKey);

	if (!(wasRegularPrimaryKey && isTheFieldAnyPrimaryKey)) {
		return PrimaryKeyTransitionDto.noTransition();
	}

	const pkDto = collection?.role?.compMod?.primaryKey || {};
	const newPrimaryKeys = pkDto.new || [];
	const oldPrimaryKeys = pkDto.old || [];
	const wasTheFieldACompositePrimaryKey = oldPrimaryKeys.some(compPk =>
		compPk.compositePrimaryKey?.some(pk => pk.keyId === oldColumnJsonSchema.GUID),
	);
	const isTheFieldACompositePrimaryKey = newPrimaryKeys.some(compPk =>
		compPk.compositePrimaryKey?.some(pk => pk.keyId === columnJsonSchema.GUID),
	);

	const wasCompositePkAdded = isTheFieldACompositePrimaryKey && !wasTheFieldACompositePrimaryKey;

	if (wasRegularPrimaryKey && wasCompositePkAdded) {
		// return compare custom properties and amount of columns.
		// If there was a transition and amount of composite PK columns is not equal
		// to amount of regular pk columns, we must recreate PK
		const constraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(oldColumnJsonSchema);
		const areOptionsEqual = newPrimaryKeys.some(oldCompositePk => {
			if (oldCompositePk.compositePrimaryKey?.length !== amountOfColumnsInRegularPk) {
				return false;
			}
			const oldCompositePkAsRegularPkOptions =
				getCustomPropertiesOfCompositePkForComparisonWithRegularPkOptions(oldCompositePk);

			return _.isEqual(oldCompositePkAsRegularPkOptions, constraintOptions);
		});
		return PrimaryKeyTransitionDto.transition(!areOptionsEqual);
	}

	return PrimaryKeyTransitionDto.noTransition();
};

const isFieldNoLongerARegularPk = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;

	const oldJsonSchema = collection.role.properties[oldName];
	const wasTheFieldARegularPrimaryKey = oldJsonSchema?.primaryKey && !oldJsonSchema?.compositePrimaryKey;

	const isNotAnyPrimaryKey = !columnJsonSchema.primaryKey && !columnJsonSchema.compositePrimaryKey;
	return wasTheFieldARegularPrimaryKey && isNotAnyPrimaryKey;
};

const wasRegularPkModified = (columnJsonSchema, collection) => {
	const oldName = columnJsonSchema.compMod.oldField.name;
	const oldJsonSchema = collection.role.properties[oldName] || {};

	const isRegularPrimaryKey = columnJsonSchema.primaryKey && !columnJsonSchema.compositePrimaryKey;
	const wasTheFieldARegularPrimaryKey = oldJsonSchema?.primaryKey && !oldJsonSchema?.compositePrimaryKey;

	if (!(isRegularPrimaryKey && wasTheFieldARegularPrimaryKey)) {
		return false;
	}
	const constraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(columnJsonSchema);
	const oldConstraintOptions = getCustomPropertiesOfRegularPkForComparisonWithRegularPkOptions(oldJsonSchema);

	return !_.isEqual(oldConstraintOptions, constraintOptions);
};

const getAddPkScriptDtos = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const entityName = getEntityName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			if (wasFieldChangedToBeARegularPk(jsonSchema, collection)) {
				return true;
			}
			const transitionToRegularDto = wasRegularPkChangedInTransitionFromCompositeToRegular(
				jsonSchema,
				collection,
			);
			if (transitionToRegularDto.didTransitionHappen) {
				return transitionToRegularDto.wasPkChangedInTransition;
			}
			return wasRegularPkModified(jsonSchema, collection);
		})
		.map(([name, jsonSchema]) => {
			const ddlConfig = getCreateRegularPKDDLProviderConfig(name, jsonSchema, entityName, collection);
			const statementDto = alterPkConstraint(fullTableName, isCollectionActivated, ddlConfig);
			return new KeyScriptModificationDto(statementDto.statement, fullTableName, false, statementDto.isActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getDropPkScriptDto = collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);

	const isContainerActivated = isParentContainerActivated(collection);
	const isCollectionActivated = isContainerActivated && isObjectInDeltaModelActivated(collection);

	return _.toPairs(collection.properties)
		.filter(([name, jsonSchema]) => {
			if (isFieldNoLongerARegularPk(jsonSchema, collection)) {
				return true;
			}
			const transitionToRegularDto = wasRegularPkChangedInTransitionFromRegularToComposite(
				jsonSchema,
				collection,
			);
			if (transitionToRegularDto.didTransitionHappen) {
				return transitionToRegularDto.wasPkChangedInTransition;
			}
			return wasRegularPkModified(jsonSchema, collection);
		})
		.map(([name, jsonSchema]) => {
			const script = dropPK(fullTableName);
			return new KeyScriptModificationDto(script, fullTableName, true, isCollectionActivated);
		})
		.filter(scriptDto => Boolean(scriptDto.script));
};

const getModifyPkScriptDtos = collection => {
	const dropPkScriptDtos = getDropPkScriptDto(collection);
	const addPkScriptDtos = getAddPkScriptDtos(collection);

	return [...dropPkScriptDtos, ...addPkScriptDtos].filter(Boolean);
};

const sortModifyPkConstraints = constraintDtos => {
	return constraintDtos.sort((c1, c2) => {
		if (c1.fullTableName === c2.fullTableName) {
			// Number(true) = 1, Number(false) = 0;
			// This ensures that DROP script appears before CREATE script
			// if the same table has 2 scripts that drop and recreate PK
			return Number(c2.isDropScript) - Number(c1.isDropScript);
		}
		// This sorts all statements based on full table name, ASC
		return c1.fullTableName < c2.fullTableName;
	});
};

const getModifyPkConstraintsScriptDtos = collection => {
	const modifyCompositePkScriptDtos = getModifyCompositePkScriptDtos(collection);
	const modifyPkScriptDtos = getModifyPkScriptDtos(collection);

	const allDtos = [...modifyCompositePkScriptDtos, ...modifyPkScriptDtos];
	const sortedAllDtos = sortModifyPkConstraints(allDtos);

	return sortedAllDtos
		.map(dto => {
			return AlterScriptDto.getInstance([dto.script], dto.isActivated, dto.isDropScript);
		})
		.filter(Boolean);
};

module.exports = {
	getModifyPkConstraintsScriptDtos,
};
