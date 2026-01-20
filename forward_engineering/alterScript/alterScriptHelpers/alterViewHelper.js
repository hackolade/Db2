/**
 * @typedef {import('../../../shared/types').App} App
 */
const { getModifyViewCommentsScriptDtos } = require('./viewHelpers/commentsHelper');
const { getModifyViewNameScriptDtos, getRenameViewScriptDto } = require('./viewHelpers/alterNameHelper');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { wrapInQuotes, getSchemaOfAlterView, getFullCollectionName } = require('../../utils/general');
const { getKeys } = require('./viewHelpers/getKeys');
const { createView } = require('./viewHelpers/createView');
const { getModifySelectStatementScriptDto } = require('./viewHelpers/alterViewStatementHelper');

/**
 * @param {Object} ddlProvider
 * @param {Function} mapProperties
 * @returns {(view: Object) => AlterScriptDto}
 */
const getAddViewScriptDto = (ddlProvider, mapProperties) => view => {
	const script = createView(ddlProvider, mapProperties, view);

	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {Object} ddlProvider
 * @returns {(view: Object) => AlterScriptDto}
 */
const getDeleteViewScriptDto = ddlProvider => view => {
	const viewSchema = getSchemaOfAlterView(view);
	const fullViewName = getFullCollectionName(viewSchema);
	const script = ddlProvider.dropView({ viewName: fullViewName });

	return AlterScriptDto.getInstance([script], true, true);
};

const getModifyViewScriptDtos = (ddlProvider, mapProperties) => view => {
	const renameViewNameScriptDtos = getRenameViewScriptDto(view, ddlProvider, mapProperties);
	const modifyCommentsScriptDtos = getModifyViewCommentsScriptDtos(view);
	const modifySelectStatementScriptDto = getModifySelectStatementScriptDto(view, ddlProvider, mapProperties);

	return [renameViewNameScriptDtos, modifySelectStatementScriptDto, ...modifyCommentsScriptDtos].filter(Boolean);
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
