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

const getDeleteCollectionScriptDto = ddlProvider => collection => {
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const fullTableName = getFullCollectionName(collectionSchema);
	const script = ddlProvider.dropTable({ tableName: fullTableName });

	return AlterScriptDto.getInstance([script], true, true);
};

const getModifyCollectionScriptDtos = collection => {
	const modifyCheckConstraintScriptDtos = getModifyCheckConstraintScriptDtos(collection);
	const modifyCommentScriptDtos = getModifyEntityCommentsScriptDtos(collection);
	return [...modifyCheckConstraintScriptDtos, ...modifyCommentScriptDtos].filter(Boolean);
};

const getModifyCollectionKeysScriptDtos = collection => {
	const modifyPkConstraintDtos = getModifyPkConstraintsScriptDtos(collection);
	const modifyUkConstraintDtos = getModifyUkConstraintsScriptDtos(collection);
	return [...modifyPkConstraintDtos, ...modifyUkConstraintDtos].filter(Boolean);
};

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

const getModifyColumnScriptDtos = ddlProvider => collection => {
	const renamedColumnsScriptDtos = getRenameColumnScriptDtos(ddlProvider)(collection);
	const modifyNotNullScriptDtos = getModifyNonNullColumnsScriptDtos(collection);
	const modifyCommentScriptDtos = getModifiedCommentOnColumnScriptDtos(collection);
	const modifyDefaultColumnValueScriptDtos = getModifiedDefaultColumnValueScriptDtos({ collection });
	const modifyTypeScriptDtos = getUpdateTypesScriptDtos(ddlProvider)(collection);

	return [
		...renamedColumnsScriptDtos,
		...modifyTypeScriptDtos,
		...modifyNotNullScriptDtos,
		...modifyDefaultColumnValueScriptDtos,
		...modifyCommentScriptDtos,
	].filter(Boolean);
};

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
