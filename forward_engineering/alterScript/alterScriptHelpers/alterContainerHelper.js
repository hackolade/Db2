const { isEmpty } = require('lodash');
const ddlProvider = require('../../ddlProvider');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const {
	getSchemaCommentStatement,
	getDeleteCommentStatement,
} = require('../../ddlProvider/ddlHelpers/comment/commentHelper');
const { wrapInQuotes, getIsChangeProperties, getUpdatedProperties } = require('../../utils/general');
const { getModifiedCommentOnSchemaScriptDtos } = require('./containerHelpers/commentsHelper');

const extractSchemaName = containerData => containerData.role.name;

const getAddContainerScriptDto = ddlProvider => containerData => {
	const schemaData = {
		...containerData.role,
		schemaName: extractSchemaName(containerData),
	};
	const script = ddlProvider.createSchema(schemaData);

	return AlterScriptDto.getInstance([script], true, false);
};

const getDeleteContainerScriptDto = ddlProvider => containerData => {
	const script = ddlProvider.dropSchema({ name: extractSchemaName(containerData) });

	return AlterScriptDto.getInstance([script], true, true);
};

const getModifyContainerScriptDto = ddlProvider => containerData => {
	const scripts = [];
	const compMod = containerData.role?.compMod || {};
	const schemaName = extractSchemaName(containerData);
	const wrappedSchemaName = wrapInQuotes(schemaName);
	const isActivated = containerData.isActivated !== false;
	const updatedProperties = getUpdatedProperties(compMod, ['dataCapture']);

	if (!isEmpty(updatedProperties)) {
		const alterDataCaptureScript = ddlProvider.alterSchema(schemaName, updatedProperties);
		scripts.push(AlterScriptDto.getInstance([alterDataCaptureScript], isActivated, false));
	}

	const commentScript = getModifiedCommentOnSchemaScriptDtos({
		schemaName: wrappedSchemaName,
		compMod,
		isActivated,
	});

	if (commentScript) {
		scripts.push(commentScript);
	}

	return scripts;
};

const getContainersScripts = app => {
	const ddlProvider = require('../../ddlProvider/ddlProvider')(null, null, app);

	return {
		getAddContainerScriptDto: getAddContainerScriptDto(ddlProvider),
		getDeleteContainerScriptDto: getDeleteContainerScriptDto(ddlProvider),
		getModifyContainerScriptDto: getModifyContainerScriptDto(ddlProvider),
	};
};

module.exports = {
	getContainersScripts,
};
