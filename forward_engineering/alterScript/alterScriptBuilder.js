const { commentIfDeactivated } = require('../utils/general');
const { getAlterScriptDtos } = require('./alterScriptFromDeltaHelper');

const joinAlterScriptDtosIntoScript = (dtos, shouldApplyDropStatements) => {
	return dtos
		.flatMap(dto => {
			if (dto.isActivated === false) {
				return dto.scripts.map(scriptDto =>
					commentIfDeactivated(scriptDto.script, {
						isActivated: false,
						isPartOfLine: false,
					}),
				);
			}
			if (!shouldApplyDropStatements) {
				return dto.scripts.map(scriptDto =>
					commentIfDeactivated(scriptDto.script, {
						isActivated: !scriptDto.isDropScript,
						isPartOfLine: false,
					}),
				);
			}
			return dto.scripts.map(scriptDto => scriptDto.script);
		})
		.map(scriptLine => scriptLine?.trim())
		.filter(Boolean)
		.join('\n\n');
};

const mapCoreDataForContainerLevelScripts = data => {
	return {
		...data,
		jsonSchema: data.collections[0],
		internalDefinitions: Object.values(data.internalDefinitions)[0],
	};
};

const buildContainerLevelAlterScript = (data, app) => {
	const preparedData = mapCoreDataForContainerLevelScripts(data);
	const alterScriptDtos = [];
	const shouldApplyDropStatements = preparedData.options?.additionalOptions?.some(
		option => option.id === 'applyDropStatements' && option.value,
	);

	return joinAlterScriptDtosIntoScript(alterScriptDtos, shouldApplyDropStatements);
};

module.exports = {
	buildContainerLevelAlterScript,
};
