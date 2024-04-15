const _ = require('lodash');
const templates = require('./templates');
const defaultTypes = require('../configs/defaultTypes.js');
const descriptors = require('../configs/descriptors.js');
const {
	commentIfDeactivated,
	wrapInQuotes,
	getNamePrefixedWithSchemaName,
	checkAllKeysDeactivated,
	toArray,
	hasType,
	setTab,
} = require('../utils/general.js');
const { assignTemplates } = require('../utils/assignTemplates');
const keyHelper = require('./ddlHelpers/keyHelper.js');
const {
	getColumnComments,
	canHaveIdentity,
	decorateType,
	getColumnDefault,
	getColumnEncrypt,
	getColumnConstraints,
} = require('./ddlHelpers/columnDefinitionHelper.js');
const { getTableCommentStatement } = require('./ddlHelpers/comment/commentHelper.js');
const { getTableProps } = require('./ddlHelpers/table/getTableProps.js');
const { getTableOptions } = require('./ddlHelpers/table/getTableOptions.js');
const { isNotPlainType } = require('./ddlHelpers/udt/udt.js');
const { getViewData } = require('./ddlHelpers/view/getViewData.js');

module.exports = (baseProvider, options, app) => {
	return {
		getDefaultType(type) {
			return defaultTypes[type];
		},

		getTypesDescriptors() {
			return descriptors;
		},

		hasType(type) {
			return hasType({ descriptors, type });
		},

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
			const isUDTRef = !!jsonSchema.$ref;
			const type = isUDTRef ? columnDefinition.type : _.toUpper(jsonSchema.mode || jsonSchema.type);
			const itemsType = _.toUpper(jsonSchema.items?.type || '');

			return {
				name: columnDefinition.name,
				type,
				ofType: jsonSchema.ofType,
				notPersistable: jsonSchema.notPersistable,
				size: jsonSchema.size,
				primaryKey: keyHelper.isInlinePrimaryKey({ column: jsonSchema }),
				primaryKeyOptions: jsonSchema.primaryKeyOptions,
				unique: keyHelper.isInlineUnique({ column: jsonSchema }),
				uniqueKeyOptions: jsonSchema.uniqueKeyOptions,
				nullable: columnDefinition.nullable,
				default: columnDefinition.default,
				comment: jsonSchema.refDescription || jsonSchema.description || definitionJsonSchema.description,
				isActivated: columnDefinition.isActivated,
				scale: columnDefinition.scale,
				precision: columnDefinition.precision,
				length: columnDefinition.length,
				schemaName: schemaData.schemaName,
				checkConstraints: jsonSchema.checkConstraints,
				fractSecPrecision: jsonSchema.fractSecPrecision,
				withTimeZone: jsonSchema.withTimeZone,
				localTimeZone: jsonSchema.localTimeZone,
				lengthSemantics: jsonSchema.lengthSemantics,
				encryption: jsonSchema.encryption,
				isUDTRef,
				itemsType,
				...(canHaveIdentity(jsonSchema.mode) && { identity: jsonSchema.identity }),
			};
		},

		hydrateJsonSchemaColumn(jsonSchema, definitionJsonSchema) {
			if (!jsonSchema.$ref || _.isEmpty(definitionJsonSchema) || isNotPlainType(definitionJsonSchema)) {
				return jsonSchema;
			}

			return { ...definitionJsonSchema, ..._.omit(jsonSchema, '$ref') };
		},

		convertColumnDefinition(columnDefinition, template = templates.columnDefinition) {
			const statement = assignTemplates(template, {
				name: wrapInQuotes(columnDefinition.name),
				type: decorateType(columnDefinition),
				default: getColumnDefault(columnDefinition),
				encrypt: getColumnEncrypt(columnDefinition),
				constraints: getColumnConstraints(columnDefinition),
			});

			return commentIfDeactivated(statement, { isActivated: columnDefinition.isActivated });
		},

		hydrateCheckConstraint(checkConstraint) {
			return {
				name: checkConstraint.chkConstrName,
				expression: checkConstraint.constrExpression,
				comments: checkConstraint.constrComments,
				description: checkConstraint.constrDescription,
			};
		},

		createCheckConstraint({ name, expression, comments, description }) {
			return assignTemplates(templates.checkConstraint, {
				name: name ? `CONSTRAINT ${wrapInQuotes(name)} ` : '',
				expression: _.trim(expression).replace(/^\(([\s\S]*)\)$/, '$1'),
			});
		},

		createForeignKeyConstraint(
			{
				name,
				foreignKey,
				primaryTable,
				primaryKey,
				primaryTableActivated,
				foreignTableActivated,
				primarySchemaName,
				customProperties,
			},
			dbData,
			schemaData,
		) {
			const isAllPrimaryKeysDeactivated = checkAllKeysDeactivated({ keys: primaryKey });
			const isAllForeignKeysDeactivated = checkAllKeysDeactivated({ keys: foreignKey });
			const isActivated =
				!isAllPrimaryKeysDeactivated &&
				!isAllForeignKeysDeactivated &&
				primaryTableActivated &&
				foreignTableActivated;

			const foreignKeys = toArray(foreignKey);
			const primaryKeys = toArray(primaryKey);

			const onDelete = keyHelper.customPropertiesForForeignKey({ customProperties });
			const primaryTableName = getNamePrefixedWithSchemaName({
				name: primaryTable,
				schemaName: primarySchemaName || schemaData.schemaName,
			});
			const constraintName = name ? `CONSTRAINT ${wrapInQuotes(name)}` : '';
			const foreignKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: foreignKeys })
				: keyHelper.foreignActiveKeysToString({ keys: foreignKeys });
			const primaryKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: primaryKeys })
				: keyHelper.foreignActiveKeysToString({ keys: primaryKeys });

			const foreignKeyStatement = assignTemplates(templates.createForeignKeyConstraint, {
				primaryTable: primaryTableName,
				name: constraintName,
				foreignKey: foreignKeyName,
				primaryKey: primaryKeyName,
				onDelete,
			});

			return {
				statement: _.trim(foreignKeyStatement),
				isActivated,
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
			const isAllPrimaryKeysDeactivated = checkAllKeysDeactivated({ keys: primaryKey });
			const isAllForeignKeysDeactivated = checkAllKeysDeactivated({ keys: foreignKey });
			const isActivated =
				!isAllPrimaryKeysDeactivated &&
				!isAllForeignKeysDeactivated &&
				primaryTableActivated &&
				foreignTableActivated;

			const foreignKeys = toArray(foreignKey);
			const primaryKeys = toArray(primaryKey);

			const onDelete = keyHelper.customPropertiesForForeignKey({ customProperties });
			const primaryTableName = getNamePrefixedWithSchemaName({
				name: primaryTable,
				schemaName: primarySchemaName || schemaData.schemaName,
			});
			const foreignTableName = getNamePrefixedWithSchemaName({
				name: foreignTable,
				schemaName: foreignSchemaName || schemaData.schemaName,
			});
			const constraintName = name ? wrapInQuotes(name) : '';
			const foreignKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: foreignKeys })
				: keyHelper.foreignActiveKeysToString({ keys: foreignKeys });
			const primaryKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: primaryKeys })
				: keyHelper.foreignActiveKeysToString({ keys: primaryKeys });

			const foreignKeyStatement = assignTemplates(templates.createForeignKey, {
				primaryTable: primaryTableName,
				foreignTable: foreignTableName,
				name: constraintName,
				foreignKey: foreignKeyName,
				primaryKey: primaryKeyName,
				onDelete,
			});

			return {
				statement: _.trim(foreignKeyStatement) + '\n',
				isActivated,
			};
		},

		hydrateTable({ tableData, entityData, jsonSchema }) {
			const detailsTab = entityData[0];
			const superTableId = detailsTab.underSuperTable?.[0]?.parentTable;
			const superTableSchema = tableData.relatedSchemas?.[superTableId];
			const underSuperTable = superTableSchema?.code || superTableSchema?.collectionName;

			return {
				...tableData,
				keyConstraints: keyHelper.getTableKeyConstraints({ jsonSchema }),
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
			return {
				name: data.name,
				tableName: data.entityName,
				alias: data.alias,
				isActivated: data.isActivated,
				dbName: data.dbName,
			};
		},

		hydrateView({ viewData, entityData }) {
			const detailsTab = entityData[0];

			return {
				name: viewData.name,
				keys: viewData.keys,
				orReplace: detailsTab.or_replace,
				selectStatement: detailsTab.selectStatement,
				tableName: viewData.tableName,
				schemaName: viewData.schemaData.schemaName,
				description: detailsTab.description,
				rootTableAlias: detailsTab.rootTableAlias,
				tableTagsClause: detailsTab.tableTagsClause,
				viewProperties: detailsTab.viewProperties,
			};
		},

		createView(viewData, dbData, isActivated) {
			const viewName = getNamePrefixedWithSchemaName({ name: viewData.name, schemaName: viewData.schemaName });
			const orReplace = viewData.orReplace ? ' OR REPLACE' : '';

			const { columns, tables } = getViewData({ keys: viewData.keys });
			const columnsAsString = columns.map(column => column.statement).join(',\n\t\t');
			const commentStatement = getTableCommentStatement({
				tableName: viewName,
				description: viewData.description,
			});
			const comment = commentStatement ? '\n' + commentStatement + `\n` : '\n';
			const viewProperties = viewData.viewProperties ? ' \n' + setTab({ text: viewData.viewProperties }) : '';

			const selectStatement = _.trim(viewData.selectStatement)
				? _.trim(setTab({ text: viewData.selectStatement }))
				: assignTemplates(templates.viewSelectStatement, {
						tableName: tables.join(', '),
						keys: columnsAsString,
					});

			const statement = assignTemplates(templates.createView, {
				name: viewName,
				orReplace,
				viewProperties,
				selectStatement,
			});

			return commentIfDeactivated(statement + comment, { isActivated });
		},

		commentIfDeactivated(statement, data, isPartOfLine) {
			return statement;
		},
	};
};
