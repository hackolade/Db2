const {
	getModifyCollectionScriptDtos,
	getModifyCollectionKeysScriptDtos,
	getModifyColumnScriptDtos,
} = require('./alterScriptHelpers/alterEntityHelper');
const {
	getDeleteForeignKeyScriptDtos,
	getAddForeignKeyScriptDtos,
	getModifyForeignKeyScriptDtos,
} = require('./alterScriptHelpers/alterForeignKeyHelper');
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

	const modifyCollectionScriptDtos = modifyScriptsData.flatMap(getModifyCollectionScriptDtos);
	const modifyCollectionKeysScriptDtos = modifyScriptsData.flatMap(getModifyCollectionKeysScriptDtos);
	const modifyColumnScriptDtos = modifyScriptsData.flatMap(getModifyColumnScriptDtos);

	return [...modifyCollectionScriptDtos, ...modifyColumnScriptDtos, ...modifyCollectionKeysScriptDtos].filter(
		Boolean,
	);
};

const getAlterViewScriptDtos = (collection, app) => {
	const modifyViewScriptDtos = getItems(collection.properties?.views?.properties?.modified)
		.map(viewWrapper => Object.values(viewWrapper.properties)[0])
		.map(view => ({ ...view, ...view.role }))
		.flatMap(view => getModifyViewScriptDtos(view));

	return [...modifyViewScriptDtos].filter(Boolean);
};

const getAlterRelationshipsScriptDtos = ({ collection, app, ignoreRelationshipIDs = [] }) => {
	const ddlProvider = require('../ddlProvider/ddlProvider')(null, null, app);

	const addedRelationships = getItems(collection.properties?.relationships?.properties?.added)
		.filter(Boolean)
		.map(item => Object.values(item.properties)[0])
		.filter(
			relationship =>
				relationship?.role?.compMod?.created && !ignoreRelationshipIDs.includes(relationship?.role?.id),
		);

	const deletedRelationships = getItems(collection.properties?.relationships?.properties?.deleted)
		.filter(Boolean)
		.map(item => Object.values(item.properties)[0])
		.filter(
			relationship =>
				relationship?.role?.compMod?.deleted && !ignoreRelationshipIDs.includes(relationship?.role?.id),
		);

	const modifiedRelationships = getItems(collection.properties?.relationships?.properties?.modified)
		.filter(Boolean)
		.map(item => Object.values(item.properties)[0])
		.filter(
			relationship =>
				relationship?.role?.compMod?.modified && !ignoreRelationshipIDs.includes(relationship?.role?.id),
		);

	const deleteFkScriptDtos = getDeleteForeignKeyScriptDtos(ddlProvider)(deletedRelationships);
	const addFkScriptDtos = getAddForeignKeyScriptDtos(ddlProvider)(addedRelationships);
	const modifiedFkScriptDtos = getModifyForeignKeyScriptDtos(ddlProvider)(modifiedRelationships);

	return [...deleteFkScriptDtos, ...addFkScriptDtos, ...modifiedFkScriptDtos].filter(Boolean);
};

const getInlineRelationships = ({ collection, options }) => {
	if (options?.scriptGenerationOptions?.feActiveOptions?.foreignKeys !== 'inline') {
		return [];
	}

	const addedCollectionIDs = getItems(collection.properties?.entities?.properties?.added)
		.filter(item => item && Object.values(item.properties)?.[0]?.compMod?.created)
		.map(item => Object.values(item.properties)[0].role.id);

	const addedRelationships = getItems(collection.properties?.relationships?.properties?.added)
		.map(item => item && Object.values(item.properties)[0])
		.filter(r => r?.role?.compMod?.created && addedCollectionIDs.includes(r?.role?.childCollection));

	return addedRelationships;
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

	const inlineDeltaRelationships = getInlineRelationships({ collection, options: data.options });
	const ignoreRelationshipIDs = inlineDeltaRelationships.map(relationship => relationship.role.id);

	const collectionsScriptDtos = getAlterCollectionScriptDtos({
		collection,
		app,
		dbVersion,
		modelDefinitions,
		internalDefinitions,
		externalDefinitions,
	});

	const viewScriptDtos = getAlterViewScriptDtos({ collection, app });

	const relationshipScriptDtos = getAlterRelationshipsScriptDtos({
		collection,
		app,
		ignoreRelationshipIDs,
	});

	return [...collectionsScriptDtos, ...viewScriptDtos, ...relationshipScriptDtos]
		.filter(Boolean)
		.map(dto => dto && prettifyAlterScriptDto(dto))
		.filter(Boolean);
};

module.exports = {
	getAlterScriptDtos,
};
