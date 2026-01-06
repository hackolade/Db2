const {
	getModifyCollectionScriptDtos,
	getModifyCollectionKeysScriptDtos,
	getModifyColumnScriptDtos,
} = require('./alterScriptHelpers/alterEntityHelper');
const { getModifyViewScriptDtos } = require('./alterScriptHelpers/alterViewHelper');

const getItems = data => [data?.items].flat().filter(Boolean);

const getAlterCollectionScriptDtos = ({
	collection,
	app,
	dbVersion,
	modelDefinitions,
	internalDefinitions,
	externalDefinitions,
}) => {
	const modifyScriptsData = getItems(collection.properties?.entities?.properties?.modified).map(
		item => Object.values(item.properties)[0],
	);

	const modifyCollectionScriptDtos = modifyScriptsData.flatMap(getModifyCollectionScriptDtos({ dbVersion }));
	const modifyCollectionKeysScriptDtos = modifyScriptsData.flatMap(getModifyCollectionKeysScriptDtos({ dbVersion }));

	const modifyColumnScriptDtos = modifyScriptsData.flatMap(
		getModifyColumnScriptDtos({ app, dbVersion, modelDefinitions, internalDefinitions, externalDefinitions }),
	);

	return [...modifyCollectionScriptDtos, ...modifyColumnScriptDtos, ...modifyCollectionKeysScriptDtos].filter(
		Boolean,
	);
};

const getAlterViewScriptDtos = (collection, app) => {
	const modifyViewScriptDtos = getItems(collection.properties?.views?.properties?.modified)
		.map(viewWrapper => Object.values(viewWrapper.properties)[0])
		.map(view => ({ ...view, ...(view.role || {}) }))
		.flatMap(view => getModifyViewScriptDtos(view));

	return [...modifyViewScriptDtos].filter(Boolean);
};

const prettifyAlterScriptDto = dto => {
	if (!dto) {
		return undefined;
	}
	/**
	 * @type {Array<ModificationScript>}
	 * */
	const nonEmptyScriptModificationDtos = dto.scripts
		.map(scriptDto => ({
			...scriptDto,
			script: (scriptDto.script || '').trim(),
		}))
		.filter(scriptDto => Boolean(scriptDto.script));
	if (!nonEmptyScriptModificationDtos.length) {
		return undefined;
	}
	return {
		...dto,
		scripts: nonEmptyScriptModificationDtos,
	};
};

const getAlterScriptDtos = (data, app) => {
	const collection = JSON.parse(data.jsonSchema);

	if (!collection) {
		throw new Error(
			'"comparisonModelCollection" is not found. Alter script can be generated only from Delta model',
		);
	}

	const modelDefinitions = JSON.parse(data.modelDefinitions);
	const internalDefinitions = JSON.parse(data.internalDefinitions);
	const externalDefinitions = JSON.parse(data.externalDefinitions);
	const dbVersion = data.modelData[0]?.dbVersion;

	const collectionsScriptDtos = getAlterCollectionScriptDtos({
		collection,
		app,
		dbVersion,
		modelDefinitions,
		internalDefinitions,
		externalDefinitions,
	});

	const viewScriptDtos = getAlterViewScriptDtos({ collection, app });

	return [...collectionsScriptDtos, ...viewScriptDtos]
		.filter(Boolean)
		.map(dto => dto && prettifyAlterScriptDto(dto))
		.filter(Boolean);
};

module.exports = {
	getAlterScriptDtos,
};
