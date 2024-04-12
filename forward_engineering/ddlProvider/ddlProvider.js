const _ = require('lodash');
const templates = require('./templates');
const { commentIfDeactivated, wrapInQuotes, getNamePrefixedWithSchemaName } = require('../utils/general.js');
const { assignTemplates } = require('../utils/assignTemplates');
const keyHelper = require('./ddlHelpers/keyHelper.js');
const { getColumnComments } = require('./ddlHelpers/columnDefinitionHelper.js');
const { getTableCommentStatement } = require('./ddlHelpers/comment/comment.js');
const { getTableProps } = require('./ddlHelpers/table/getTableProps.js');
const { getTableOptions } = require('./ddlHelpers/table/getTableOptions.js');

module.exports = (baseProvider, options, app) => {
	return {
		hydrateSchema(containerData, data) {
			const dbVersion = _.get(data, 'modelData.0.dbVersion');
			return {
				schemaName: containerData.name,
				ifNotExist: containerData.ifNotExist,
				authorizationName: containerData.authorizationName,
				dataCapture: containerData.dataCapture,
				dbVersion,
			};
		},

		createSchema({ schemaName, ifNotExist, dbVersion, authorizationName, dataCapture }) {
			const schemaStatement = assignTemplates(templates.createSchema, {
				schemaName: wrapInQuotes(schemaName),
				ifNotExists: ifNotExist ? ' IF NOT EXISTS' : '',
				authorization: authorizationName ? ' AUTHORIZATION ' + authorizationName : '',
				dataCapture: dataCapture ? ' DATA CAPTURE ' + dataCapture : '',
			});

			return schemaStatement;
		},

		hydrateColumn({ columnDefinition, jsonSchema, schemaData, definitionJsonSchema = {} }) {
			return {};
		},

		hydrateJsonSchemaColumn(jsonSchema, definitionJsonSchema) {
			return {};
		},

		hydrateCheckConstraint(checkConstraint) {
			return {};
		},

		createCheckConstraint({ name, expression, comments, description }) {
			return {};
		},

		createForeignKeyConstraint(
			{
				name,
				foreignKey,
				primaryTable,
				primaryKey,
				primaryTableActivated,
				foreignTableActivated,
				foreignSchemaName,
				primarySchemaName,
				customProperties,
			},
			dbData,
			schemaData,
		) {
			return {
				statement: '',
				isActivated: true,
			};
		},

		createForeignKey(
			{
				name,
				foreignTable,
				foreignKey,
				primaryTable,
				primaryKey,
				primaryTableActivated,
				foreignTableActivated,
				foreignSchemaName,
				primarySchemaName,
				customProperties,
			},
			dbData,
			schemaData,
		) {
			return {
				statement: '' + '\n',
				isActivated: true,
			};
		},

		hydrateTable({ tableData, entityData, jsonSchema }) {
			const detailsTab = entityData[0];
			const superTableId = detailsTab.underSuperTable?.[0]?.parentTable;
			const superTableSchema = tableData.relatedSchemas?.[superTableId];
			const underSuperTable = superTableSchema?.code || superTableSchema?.collectionName;

			return {
				...tableData,
				keyConstraints: keyHelper.getTableKeyConstraints(jsonSchema),
				selectStatement: _.trim(detailsTab.selectStatement),
				temporary: detailsTab.temporary,
				description: detailsTab.description,
				ifNotExist: detailsTab.ifNotExist,
				tableProperties: detailsTab.tableProperties,
				table_tablespace_name: detailsTab.table_tablespace_name,
				underSuperTable,
			};
		},

		createTable(
			{
				checkConstraints,
				columnDefinitions,
				columns,
				foreignKeyConstraints,
				keyConstraints,
				name,
				schemaData,
				selectStatement,
				temporary,
				table_tablespace_name,
				underSuperTable,
				description,
				ifNotExist,
				tableProperties,
			},
			isActivated,
		) {
			const ifNotExists = ifNotExist ? ' IF NOT EXISTS' : '';
			const tableType = temporary ? ' GLOBAL TEMPORARY' : '';
			const tableName = getNamePrefixedWithSchemaName({ name, schemaName: schemaData.schemaName });
			const tableProps = getTableProps({
				columns,
				foreignKeyConstraints,
				keyConstraints,
				checkConstraints,
				isActivated,
			});
			const tableOptions = getTableOptions({
				selectStatement,
				tableProperties,
				table_tablespace_name,
				underSuperTable,
			});

			const comment = getTableCommentStatement({ tableName, description });
			const columnComments = getColumnComments({ tableName, columnDefinitions });
			const commentStatements = comment || columnComments ? '\n' + comment + columnComments + '\n' : '';

			const createTableDdl = assignTemplates(templates.createTable, {
				name: tableName,
				ifNotExists,
				tableProps,
				tableType,
				tableOptions,
			});

			return commentIfDeactivated(createTableDdl + commentStatements, {
				isActivated,
			});
		},

		hydrateIndex(indexData, tableData, schemaData) {
			return {};
		},

		createIndex(tableName, index, dbData, isParentActivated = true) {
			return '';
		},

		hydrateViewColumn(data) {
			return {};
		},

		hydrateView({ viewData, entityData, jsonSchema }) {
			return {};
		},

		createView(viewData, dbData, isActivated) {
			return '';
		},

		commentIfDeactivated(statement, data, isPartOfLine) {
			return statement;
		},
	};
};
