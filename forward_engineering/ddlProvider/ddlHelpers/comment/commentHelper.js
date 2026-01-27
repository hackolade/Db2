const { trim } = require('lodash');
const templates = require('../../templates');
const { assignTemplates } = require('../../../utils/assignTemplates');
const { wrapInQuotes, commentIfDeactivated, wrapInSingleQuotes } = require('../../../utils/general');

/**
 * @enum {string}
 */
const OBJECT_TYPE = {
	schema: 'SCHEMA',
	column: 'COLUMN',
	table: 'TABLE',
	index: 'INDEX',
};

/**
 * @enum {string}
 */
const COMMENT_MODE = {
	set: 'set',
	remove: 'remove',
};

/**
 * @param {string} description
 * @returns {string}
 */
const escapeSpecialCharacters = description => description.replace(/'/g, "''");

/**
 * @param {{ objectName: string, objectType: OBJECT_TYPE, description?: string, mode?: COMMENT_MODE }}
 * @returns {string}
 */
const getCommentStatement = ({ objectName, objectType, description, mode = COMMENT_MODE.set }) => {
	if (mode === COMMENT_MODE.set && !description) {
		return '';
	}

	return assignTemplates({
		template: templates.comment,
		templateData: {
			objectType,
			objectName: trim(objectName),
			comment: wrapInSingleQuotes({ name: escapeSpecialCharacters(description || '') }),
		},
	});
};

/**
 * @param {{ tableName, columnName: string, description?: string }}
 * @returns {string}
 */
const getColumnCommentStatement = ({ tableName, columnName, description }) => {
	const objectName = tableName + '.' + wrapInQuotes(columnName);
	return getCommentStatement({
		objectName,
		objectType: OBJECT_TYPE.column,
		description,
		mode: COMMENT_MODE.set,
	});
};

/**
 * @param {{ tableName: string, description?: string }}
 * @returns {string}
 */
const getTableCommentStatement = ({ tableName, description }) => {
	return getCommentStatement({
		objectName: tableName,
		objectType: OBJECT_TYPE.table,
		description,
		mode: COMMENT_MODE.set,
	});
};

/**
 * @param {{ indexName: string, description?: string }}
 * @returns {string}
 */
const getIndexCommentStatement = ({ indexName, description }) => {
	return getCommentStatement({
		objectName: indexName,
		objectType: OBJECT_TYPE.index,
		description,
		mode: COMMENT_MODE.set,
	});
};

/**
 * @param {{ schemaName: string, description?: string }}
 * @returns {string}
 */
const getSchemaCommentStatement = ({ schemaName, description }) => {
	return getCommentStatement({
		objectName: schemaName,
		objectType: OBJECT_TYPE.schema,
		description,
		mode: COMMENT_MODE.set,
	});
};

/**
 * @param {{ tableName: string, columnDefinitions: object[] }}
 * @returns {string}
 */
const getColumnComments = ({ tableName, columnDefinitions = [] }) => {
	return columnDefinitions
		.filter(columnDefinition => columnDefinition.comment)
		.map(columnDefinition => {
			const comment = getColumnCommentStatement({
				tableName,
				columnName: columnDefinition.name,
				description: columnDefinition.comment,
			});

			return commentIfDeactivated(comment, columnDefinition);
		})
		.join('\n');
};

/**
 * @param {{ schemaName: string }}
 * @returns {string}
 */
const dropSchemaCommentStatement = ({ schemaName }) => {
	return getCommentStatement({
		objectName: schemaName,
		objectType: OBJECT_TYPE.schema,
		mode: COMMENT_MODE.remove,
	});
};

/**
 * @param {{ tableName: string }}
 * @returns {string}
 */
const dropTableCommentStatement = ({ tableName }) => {
	return getCommentStatement({
		objectName: tableName,
		objectType: OBJECT_TYPE.table,
		mode: COMMENT_MODE.remove,
	});
};

/**
 * @param {{ tableName: string, columnName: string }}
 * @returns {string}
 */
const dropTableColumnCommentStatement = ({ tableName, columnName }) => {
	const objectName = tableName + '.' + wrapInQuotes(columnName);
	return getCommentStatement({
		objectName,
		objectType: OBJECT_TYPE.column,
		mode: COMMENT_MODE.remove,
	});
};

/**
 * @param {{ indexName: string }}
 * @returns {string}
 */
const dropIndexCommentStatement = ({ indexName }) => {
	return getCommentStatement({
		objectName: indexName,
		objectType: OBJECT_TYPE.index,
		mode: COMMENT_MODE.remove,
	});
};

module.exports = {
	getColumnCommentStatement,
	getSchemaCommentStatement,
	getTableCommentStatement,
	getColumnComments,
	getIndexCommentStatement,

	dropSchemaCommentStatement,
	dropTableCommentStatement,
	dropTableColumnCommentStatement,
	dropIndexCommentStatement,
};
