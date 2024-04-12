const _ = require('lodash');
const templates = require('./templates');
const {
	toArray,
	tab,
	commentIfDeactivated,
	checkAllKeysDeactivated,
	divideIntoActivatedAndDeactivated,
	hasType,
	wrap,
	clean,
	wrapInQuotes,
	getNamePrefixedWithSchemaName,
	wrapComment,
	getColumnsList,
} = require('../utils/general.js');
const { assignTemplates } = require('../utils/assignTemplates');

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
			return {};
		},

		createTable(
			{
				blockchain_table_clauses,
				checkConstraints,
				columnDefinitions,
				columns,
				duplicated,
				external,
				external_table_clause,
				foreignKeyConstraints,
				keyConstraints,
				immutable,
				name,
				partitioning,
				schemaData,
				selectStatement,
				sharded,
				storage,
				temporary,
				temporaryType,
				description,
				ifNotExist,
				tableProperties,
				synonyms,
			},
			isActivated,
		) {
			return '';
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
