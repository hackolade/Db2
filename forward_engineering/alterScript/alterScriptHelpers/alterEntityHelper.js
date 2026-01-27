/**
 * @typedef {import('../../../shared/types').App} App
 */
const { omit, toPairs } = require('lodash');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { getModifiedCommentOnColumnScriptDtos } = require('./columnHelpers/commentsHelper');
const { getModifyNonNullColumnsScriptDtos } = require('./columnHelpers/nonNullConstraintHelper');
const { getUpdateTypesScriptDtos } = require('./columnHelpers/alterTypeHelper');
const { getModifyCheckConstraintScriptDtos } = require('./entityHelpers/checkConstraintHelper');
const { getRenameColumnScriptDtos } = require('./columnHelpers/alterColumnNameHelper');
const { getModifyEntityCommentsScriptDtos } = require('./entityHelpers/commentsHelper');
const { getModifyPkConstraintsScriptDtos } = require('./entityHelpers/primaryKeyHelper');
const { getModifyUkConstraintsScriptDtos } = require('./entityHelpers/uniqueKeyHelper');
const { getModifiedDefaultColumnValueScriptDtos } = require('./columnHelpers/defaultValueHelper');
const {
	getEntityName,
	getSchemaNameFromCollection,
	getSchemaOfAlterCollection,
	getFullCollectionName,
	wrapInQuotes,
} = require('../../utils/general');
const { getRelationshipName } = require('./alterForeignKeyHelper');
const { createColumnDefinitionBySchema } = require('./createColumnDefinition');
const { getRenameTableScriptDtos } = require('./entityHelpers/alterTableNameHelper');

/**
 * @param {Object} ddlProvider
 * @param {Array<Object>} inlineDeltaRelationships
 * @returns {(collection: Object) => AlterScriptDto}
 */
const getAddCollectionScriptDto = (ddlProvider, inlineDeltaRelationships) => collection => {
	const jsonSchema = { ...collection, ...(omit(collection?.role, 'properties') || {}) };
	const schemaName = getSchemaNameFromCollection({ collection });
	const schemaData = { schemaName };

	const columnDefinitions = toPairs(jsonSchema.properties).map(([name, column]) =>
		createColumnDefinitionBySchema({
			name,
			jsonSchema: column,
			parentJsonSchema: jsonSchema,
			ddlProvider,
			schemaData,
		}),
	);

	const checkConstraints = (jsonSchema.chkConstr || []).map(check =>
		ddlProvider.createCheckConstraint(ddlProvider.hydrateCheckConstraint(check)),
	);

	const foreignKeyConstraints = inlineDeltaRelationships
		.filter(relationship => relationship.role.childCollection === collection.role.id)
		.map(relationship => {
			const compMod = relationship.role.compMod;
			const relationshipName = compMod.code?.new || compMod.name?.new || getRelationshipName(relationship) || '';
			return ddlProvider.createForeignKeyConstraint(
				{
					name: relationshipName,
					foreignKey: compMod.child.collection.fkFields,
					primaryTable: compMod.parent.collection.name,
					primaryKey: compMod.parent.collection.fkFields,
					primaryTableActivated: compMod.parent.collection.isActivated,
					foreignTableActivated: compMod.child.collection.isActivated,
					primarySchemaName: compMod.parent.bucket.name,
					customProperties: compMod.customProperties?.new,
				},
				{},
				schemaData,
			);
		});

	const tableData = {
		name: getEntityName(jsonSchema),
		columns: columnDefinitions.map(def => ddlProvider.convertColumnDefinition(def)),
		checkConstraints,
		foreignKeyConstraints,
		schemaData,
		columnDefinitions,
	};

	const hydratedTable = ddlProvider.hydrateTable({ tableData, entityData: [jsonSchema], jsonSchema });
	const script = ddlProvider.createTable(hydratedTable, jsonSchema.isActivated);

	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {Object} ddlProvider
 * @returns {(collection: Object) => AlterScriptDto}
 */
const getDeleteCollectionScriptDto = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const script = ddlProvider.dropTable({ tableName: fullTableName });

	return AlterScriptDto.getInstance([script], true, true);
};

/**
 * @param {Object} collection
 * @returns {Array<AlterScriptDto>}
 */
const getModifyCollectionScriptDtos = collection => {
	const modifyCollectionNameScriptDtos = getRenameTableScriptDtos(collection);
	const modifyCheckConstraintScriptDtos = getModifyCheckConstraintScriptDtos(collection);
	const modifyCommentScriptDtos = getModifyEntityCommentsScriptDtos(collection);
	return [...modifyCollectionNameScriptDtos, ...modifyCheckConstraintScriptDtos, ...modifyCommentScriptDtos].filter(
		Boolean,
	);
};

/**
 * @param {Object} collection
 * @returns {Array<AlterScriptDto>}
 */
const getModifyCollectionKeysScriptDtos = collection => {
	const modifyPkConstraintDtos = getModifyPkConstraintsScriptDtos(collection);
	const modifyUkConstraintDtos = getModifyUkConstraintsScriptDtos(collection);
	return [...modifyPkConstraintDtos, ...modifyUkConstraintDtos].filter(Boolean);
};

/**
 * @param {Object} ddlProvider
 * @returns {(collection: Object) => Array<AlterScriptDto>}
 */
const getAddColumnScriptDtos = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const schemaName = getSchemaNameFromCollection({ collection });
	const schemaData = { schemaName };

	return toPairs(collection.properties)
		.filter(([name, jsonSchema]) => !jsonSchema.compMod)
		.map(([name, jsonSchema]) => {
			const columnDefinition = createColumnDefinitionBySchema({
				name,
				jsonSchema,
				parentJsonSchema: collectionSchema,
				ddlProvider,
				schemaData,
			});
			const script = ddlProvider.addColumn({
				tableName: fullTableName,
				columnDefinition: ddlProvider.convertColumnDefinition(columnDefinition),
			});
			return AlterScriptDto.getInstance([script], true, false);
		})
		.filter(Boolean);
};

/**
 * @param {Object} ddlProvider
 * @returns {(collection: Object) => Array<AlterScriptDto>}
 */
const getDeleteColumnScriptDtos = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);

	return toPairs(collection.properties)
		.filter(([name, jsonSchema]) => !jsonSchema.compMod)
		.map(([name]) => {
			const columnName = wrapInQuotes(name);
			const script = ddlProvider.dropColumn({ tableName: fullTableName, columnName });
			return AlterScriptDto.getInstance([script], true, true);
		})
		.filter(Boolean);
};

/**
 * @param {Object} ddlProvider
 * @returns {(collection: Object) => Array<AlterScriptDto>}
 */
const getModifyColumnScriptDtos = ddlProvider => collection => {
	const renamedColumnsScriptDtos = getRenameColumnScriptDtos(collection);
	const updateTypeScriptDtos = getUpdateTypesScriptDtos(ddlProvider)(collection);
	const modifyNotNullScriptDtos = getModifyNonNullColumnsScriptDtos(collection);
	const modifyCommentScriptDtos = getModifiedCommentOnColumnScriptDtos(collection);
	const modifyDefaultColumnValueScriptDtos = getModifiedDefaultColumnValueScriptDtos({ collection });

	return [
		...renamedColumnsScriptDtos,
		...updateTypeScriptDtos,
		...modifyNotNullScriptDtos,
		...modifyDefaultColumnValueScriptDtos,
		...modifyCommentScriptDtos,
	].filter(Boolean);
};

/**
 * @param {App} app
 * @param {Array} inlineDeltaRelationships
 */
const getEntitiesScripts = (app, inlineDeltaRelationships) => {
	const ddlProvider = require('../../ddlProvider/ddlProvider')(null, null, app);

	return {
		getAddCollectionScriptDto: getAddCollectionScriptDto(ddlProvider, inlineDeltaRelationships),
		getDeleteCollectionScriptDto: getDeleteCollectionScriptDto(ddlProvider),
		getModifyCollectionScriptDtos,
		getModifyColumnScriptDtos: getModifyColumnScriptDtos(ddlProvider),
		getModifyCollectionKeysScriptDtos,
		getAddColumnScriptDtos: getAddColumnScriptDtos(ddlProvider),
		getDeleteColumnScriptDtos: getDeleteColumnScriptDtos(ddlProvider),
	};
};

module.exports = {
	getEntitiesScripts,
};
