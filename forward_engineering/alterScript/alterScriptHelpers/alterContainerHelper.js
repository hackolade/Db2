const _ = require('lodash');
const ddlProvider = require('../../ddlProvider');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { getSchemaCommentStatement } = require('../../ddlProvider/ddlHelpers/comment/commentHelper');

const getSchemaName = containerData => containerData.role.name;

const getAddContainerScriptDto = ddlProvider => containerData => {
	const schemaData = {
		...containerData.role,
		schemaName: getSchemaName(containerData),
	};
	const script = ddlProvider.createSchema(schemaData);

	return AlterScriptDto.getInstance([script], true, false);
};

const getDeleteContainerScriptDto = ddlProvider => containerData => {
	const script = ddlProvider.dropSchema({ name: getSchemaName(containerData) });

	return AlterScriptDto.getInstance([script], true, true);
};

const getModifyContainerScriptDto = ddlProvider => containerData => {
	const scripts = [];
	const compMod = containerData.role?.compMod || {};
	const schemaName = getSchemaName(containerData);
	const isActivated = containerData.isActivated !== false;

	const dataCapture = compMod.dataCapture || {};
	if (dataCapture.new && dataCapture.new !== dataCapture.old) {
		const alterDataCaptureScript = ddlProvider.alterSchema(schemaName, dataCapture.new);
		scripts.push(AlterScriptDto.getInstance([alterDataCaptureScript], isActivated, false));
	}

	return scripts.filter(Boolean);
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
