const { trim } = require('lodash');
const templates = require('../../templates');
const { assignTemplates } = require('../../../utils/assignTemplates');
const { wrapInQuotes, commentIfDeactivated, wrapInSingleQuotes } = require('../../../utils/general');

/**
 * @enum {string}
 */
const OBJECT_TYPE = {
	column: 'COLUMN',
	table: 'TABLE',
	index: 'INDEX',
};

/**
 * @param {{ objectName: string, objectType: OBJECT_TYPE, description?: string }}
 * @returns {string}
 */
const getCommentStatement = ({ objectName, objectType, description }) => {
	if (!description) {
		return '';
	}

	return assignTemplates({
		template: templates.comment,
		templateData: { objectType, objectName: trim(objectName), comment: wrapInSingleQuotes({ name: description }) },
	});
};

/**
 * @param {{ tableName, string, columnName: string, description?: string }}
 * @returns {string}
 */
const getColumnCommentStatement = ({ tableName, columnName, description }) => {
	const objectName = tableName + '.' + wrapInQuotes({ name: columnName });
	return getCommentStatement({ objectName, objectType: OBJECT_TYPE.column, description });
};

/**
 * @param {{ tableName: string, description?: string }}
 * @returns {string}
 */
const getTableCommentStatement = ({ tableName, description }) => {
	return getCommentStatement({ objectName: tableName, objectType: OBJECT_TYPE.table, description });
};

/**
 * @param {{ indexName: string, description?: string }}
 * @returns {string}
 */
const getIndexCommentStatement = ({ indexName, description }) => {
	return getCommentStatement({ objectName: indexName, objectType: OBJECT_TYPE.index, description });
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

module.exports = {
	getColumnCommentStatement,
	getTableCommentStatement,
	getColumnComments,
	getIndexCommentStatement,
};
