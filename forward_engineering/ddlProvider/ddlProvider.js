const { toUpper, isEmpty, trim } = require('lodash');
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
const keyHelper = require('./ddlHelpers/key/keyHelper.js');
const { getColumnType } = require('./ddlHelpers/columnDefinition/getColumnType.js');
const { getColumnDefault } = require('./ddlHelpers/columnDefinition/getColumnDefault.js');
const { getColumnConstraints } = require('./ddlHelpers/columnDefinition/getColumnConstraints.js');
const {
	getTableCommentStatement,
	getColumnComments,
	getIndexCommentStatement,
} = require('./ddlHelpers/comment/commentHelper.js');
const { getTableProps } = require('./ddlHelpers/table/getTableProps.js');
const { getTableOptions } = require('./ddlHelpers/table/getTableOptions.js');
const { getViewData } = require('./ddlHelpers/view/getViewData.js');
const { getIndexName } = require('./ddlHelpers/index/getIndexName.js');
const { getIndexType } = require('./ddlHelpers/index/getIndexType.js');
const { getIndexOptions } = require('./ddlHelpers/index/getIndexOptions.js');
const { getTableType } = require('./ddlHelpers/table/getTableType.js');
const { getName } = require('./ddlHelpers/jsonSchema/jsonSchemaHelper.js');
const { hydrateAuxiliaryTableData } = require('./ddlHelpers/table/hydrateAuxiliaryTableData.js');
const { joinActivatedAndDeactivatedStatements } = require('../utils/joinActivatedAndDeactivatedStatements');

/**
 * @param {{ columns: object[] }}
 * @returns {string}
 */
const getViewColumnsAsString = ({ columns }) => {
	const indent = '\n\t\t';
	const statements = columns.map(({ statement, isActivated }) => {
		return commentIfDeactivated(statement, { isActivated, isPartOfLine: false });
	});

	return indent + joinActivatedAndDeactivatedStatements({ statements, delimiter: ',', indent });
};

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
			return {
				schemaName: containerData.name,
				authorizationName: containerData.authorizationName,
				dataCapture: containerData.dataCapture,
			};
		},

		createSchema({ schemaName, ifNotExist, authorizationName, dataCapture }) {
			const schemaStatement = assignTemplates({
				template: templates.createSchema,
				templateData: {
					schemaName: wrapInQuotes({ name: schemaName }),
					authorization: authorizationName ? ' AUTHORIZATION ' + authorizationName : '',
					dataCapture: dataCapture ? ' DATA CAPTURE ' + dataCapture : '',
				},
			});

			return schemaStatement;
		},

		hydrateColumn({ columnDefinition, jsonSchema, schemaData, definitionJsonSchema = {} }) {
			const isUDTRef = !!jsonSchema.$ref;
			const type = isUDTRef ? columnDefinition.type : toUpper(jsonSchema.mode || jsonSchema.type);
			const itemsType = toUpper(jsonSchema.items?.mode || jsonSchema.items?.type || '');

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
				identity: jsonSchema.identity,
				isUDTRef,
				itemsType,
			};
		},

		hydrateJsonSchemaColumn(jsonSchema, definitionJsonSchema) {
			if (!jsonSchema.$ref || isEmpty(definitionJsonSchema)) {
				return jsonSchema;
			}
			const { $ref, ...jsonSchemaWithoutRef } = jsonSchema;

			return { ...definitionJsonSchema, ...jsonSchemaWithoutRef };
		},

		convertColumnDefinition(columnDefinition, template = templates.columnDefinition) {
			const statement = assignTemplates({
				template,
				templateData: {
					name: wrapInQuotes({ name: columnDefinition.name }),
					type: getColumnType(columnDefinition),
					default: getColumnDefault(columnDefinition),
					constraints: getColumnConstraints(columnDefinition),
				},
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

		createCheckConstraint({ name, expression }) {
			return assignTemplates({
				template: templates.checkConstraint,
				templateData: {
					name: name ? `CONSTRAINT ${wrapInQuotes({ name })} ` : '',
					expression: trim(expression).replace(/^\(([\s\S]*)\)$/, '$1'),
				},
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

			const foreignKeys = toArray({ value: foreignKey });
			const primaryKeys = toArray({ value: primaryKey });

			const onDelete = keyHelper.customPropertiesForForeignKey({ customProperties });
			const primaryTableName = getNamePrefixedWithSchemaName({
				name: primaryTable,
				schemaName: primarySchemaName || schemaData.schemaName,
			});
			const constraintName = name ? `CONSTRAINT ${wrapInQuotes({ name })}` : '';
			const foreignKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: foreignKeys })
				: keyHelper.foreignActiveKeysToString({ keys: foreignKeys });
			const primaryKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: primaryKeys })
				: keyHelper.foreignActiveKeysToString({ keys: primaryKeys });

			const foreignKeyStatement = assignTemplates({
				template: templates.createForeignKeyConstraint,
				templateData: {
					primaryTable: primaryTableName,
					name: constraintName,
					foreignKey: foreignKeyName,
					primaryKey: primaryKeyName,
					onDelete,
				},
			});

			return {
				statement: trim(foreignKeyStatement),
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

			const foreignKeys = toArray({ value: foreignKey });
			const primaryKeys = toArray({ value: primaryKey });

			const onDelete = keyHelper.customPropertiesForForeignKey({ customProperties });
			const primaryTableName = getNamePrefixedWithSchemaName({
				name: primaryTable,
				schemaName: primarySchemaName || schemaData.schemaName,
			});
			const foreignTableName = getNamePrefixedWithSchemaName({
				name: foreignTable,
				schemaName: foreignSchemaName || schemaData.schemaName,
			});
			const constraintName = name ? wrapInQuotes({ name }) : '';
			const foreignKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: foreignKeys })
				: keyHelper.foreignActiveKeysToString({ keys: foreignKeys });
			const primaryKeyName = isActivated
				? keyHelper.foreignKeysToString({ keys: primaryKeys })
				: keyHelper.foreignActiveKeysToString({ keys: primaryKeys });

			const foreignKeyStatement = assignTemplates({
				template: templates.createForeignKey,
				templateData: {
					primaryTable: primaryTableName,
					foreignTable: foreignTableName,
					name: constraintName,
					foreignKey: foreignKeyName,
					primaryKey: primaryKeyName,
					onDelete,
				},
			});

			return {
				statement: trim(foreignKeyStatement) + '\n',
				isActivated,
			};
		},

		hydrateTable({ tableData, entityData, jsonSchema }) {
			const detailsTab = entityData[0];
			const superTableId = detailsTab.underSuperTable?.[0]?.parentTable;
			const superTableSchema = tableData.relatedSchemas?.[superTableId];
			const underSuperTable = getName({ item: superTableSchema });
			const auxiliaryTableData = hydrateAuxiliaryTableData({ tableData, detailsTab });

			return {
				...tableData,
				...auxiliaryTableData,
				keyConstraints: keyHelper.getTableKeyConstraints({ jsonSchema }),
				selectStatement: trim(detailsTab.selectStatement),
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
				auxiliary,
				auxiliaryBaseTable,
				auxiliaryBaseColumn,
				auxiliaryAppend,
				auxiliaryPart,
				table_tablespace_name,
				underSuperTable,
				description,
				ifNotExist,
				tableProperties,
			},
			isActivated,
		) {
			const ifNotExists = ifNotExist ? ' IF NOT EXISTS' : '';
			const tableType = getTableType({ auxiliary, temporary });
			const tableName = getNamePrefixedWithSchemaName({ name, schemaName: schemaData.schemaName });
			const comment = getTableCommentStatement({ tableName, description });

			if (auxiliary) {
				const tableOptions = getTableOptions({
					table_tablespace_name,
					auxiliaryBaseTable,
					auxiliaryBaseColumn,
					auxiliaryAppend,
					auxiliaryPart,
				});
				const createTableStatement = assignTemplates({
					template: templates.createAuxiliaryTable,
					templateData: {
						name: tableName,
						tableType,
						tableOptions,
					},
				});
				const commentStatement = comment ? '\n' + comment + '\n' : '\n';

				return commentIfDeactivated(createTableStatement + commentStatement, {
					isActivated,
				});
			}

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

			const columnComments = getColumnComments({ tableName, columnDefinitions });
			const commentStatements = comment || columnComments ? '\n' + comment + columnComments : '\n';

			const createTableDdl = assignTemplates({
				template: templates.createTable,
				templateData: {
					name: tableName,
					ifNotExists,
					tableProps,
					tableType,
					tableOptions,
				},
			});

			return commentIfDeactivated(createTableDdl + commentStatements, {
				isActivated,
			});
		},

		hydrateIndex(indexData, tableData, schemaData) {
			return { ...indexData, schemaName: schemaData.schemaName };
		},

		createIndex(tableName, index) {
			const indexName = getIndexName({ index });

			if (!index.indxName || !index.indxKey.length) {
				return '';
			}

			const indexType = getIndexType({ index });
			const indexOptions = getIndexOptions({ index });
			const indexTableName = getNamePrefixedWithSchemaName({ name: tableName, schemaName: index.schemaName });
			const statement = assignTemplates({
				template: templates.createIndex,
				templateData: { indexType, indexName, indexOptions, indexTableName },
			});
			const commentStatement = getIndexCommentStatement({ indexName, description: index.indxDescription });
			const createIndexStatement = statement + commentStatement;

			return commentIfDeactivated(createIndexStatement, {
				isActivated: index.isActivated,
			});
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
			const columnsAsString = getViewColumnsAsString({ columns });
			const commentStatement = getTableCommentStatement({
				tableName: viewName,
				description: viewData.description,
			});
			const comment = commentStatement ? '\n' + commentStatement + `\n` : '\n';
			const viewProperties = viewData.viewProperties ? ' \n' + setTab({ text: viewData.viewProperties }) : '';

			const selectStatement = trim(viewData.selectStatement)
				? trim(setTab({ text: viewData.selectStatement }))
				: assignTemplates({
						template: templates.viewSelectStatement,
						templateData: {
							tableName: tables.join(', '),
							keys: columnsAsString,
						},
					});

			const statement = assignTemplates({
				template: templates.createView,
				templateData: {
					name: viewName,
					orReplace,
					viewProperties,
					selectStatement,
				},
			});

			return commentIfDeactivated(statement + comment, { isActivated });
		},

		commentIfDeactivated(statement, data, isPartOfLine) {
			return statement;
		},
	};
};
