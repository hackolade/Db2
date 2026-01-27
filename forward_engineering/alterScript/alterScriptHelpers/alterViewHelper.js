/**
 * @typedef {import('../../../shared/types').App} App
 */
const { getModifyViewCommentsScriptDtos } = require('./viewHelpers/commentsHelper');
const { getRenameViewScriptDtos } = require('./viewHelpers/alterNameHelper');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { getSchemaOfAlterCollection } = require('../../utils/general');
const { createView, dropView } = require('./viewHelpers/createDropViewHelper');
const { getModifySelectStatementScriptDtos } = require('./viewHelpers/alterViewStatementHelper');

/**
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {(view: Object) => AlterScriptDto}
 */
const getAddViewScriptDto = (ddlProvider, mapProperties) => view => {
	const script = createView({ ddlProvider, mapProperties, view });

	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {Object} ddlProvider
 * @returns {(view: Object) => AlterScriptDto}
 */
const getDeleteViewScriptDto = ddlProvider => view => {
	const viewSchema = getSchemaOfAlterCollection(view);
	const script = dropView({ ddlProvider, viewSchema });

	return AlterScriptDto.getInstance([script], true, true);
};

/**
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {(view: Object) => Array<AlterScriptDto>}
 */
const getModifyViewScriptDtos = (ddlProvider, mapProperties) => view => {
	const renameViewNameScriptDtos = getRenameViewScriptDtos(view, ddlProvider, mapProperties);
	const modifySelectStatementScriptDtos = getModifySelectStatementScriptDtos(view, ddlProvider, mapProperties);
	const modifyCommentsScriptDtos = getModifyViewCommentsScriptDtos(view);

	return [...renameViewNameScriptDtos, ...modifySelectStatementScriptDtos, ...modifyCommentsScriptDtos].filter(
		Boolean,
	);
};

/**
 * @param {App} app
 */
const getViewsScripts = app => {
	const ddlProvider = require('../../ddlProvider/ddlProvider')(null, null, app);
	const { mapProperties } = app.require('@hackolade/ddl-fe-utils');

	return {
		getAddViewScriptDto: getAddViewScriptDto(ddlProvider, mapProperties),
		getDeleteViewScriptDto: getDeleteViewScriptDto(ddlProvider),
		getModifyViewScriptDtos: getModifyViewScriptDtos(ddlProvider, mapProperties),
	};
};

module.exports = {
	getViewsScripts,
};
