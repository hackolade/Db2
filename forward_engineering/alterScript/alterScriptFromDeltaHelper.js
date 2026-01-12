const { isObjectInDeltaModelActivated } = require('../utils/general');
const { getContainersScripts } = require('./alterScriptHelpers/alterContainerHelper');
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

/**
 * @param dto {{
 *     collection: Object,
 *     app: App
 * }}
 * @return {AlterScriptDto[]}
 * */
const getAlterContainersScriptDtos = ({ collection, app }) => {
	const addedContainers = getItems(collection.properties?.containers?.properties?.added);
	const deletedContainers = getItems(collection.properties?.containers?.properties?.deleted);
	const modifiedContainers = getItems(collection.properties?.containers?.properties?.modified);

	const { getAddContainerScriptDto, getDeleteContainerScriptDto, getModifyContainerScriptDto } =
		getContainersScripts(app);

	const addContainersScriptDtos = addedContainers
		.map(container => Object.values(container.properties)[0])
		.flatMap(getAddContainerScriptDto);

	const deleteContainersScriptDtos = deletedContainers
		.map(container => Object.values(container.properties)[0])
		.flatMap(getDeleteContainerScriptDto);

	const modifyContainersScriptDtos = modifiedContainers
		.map(containerWrapper => Object.values(containerWrapper.properties)[0])
		.flatMap(getModifyContainerScriptDto);

	return [...addContainersScriptDtos, ...deleteContainersScriptDtos, ...modifyContainersScriptDtos].filter(Boolean);
};

const getAlterCollectionScriptDtos = ({
	collection,
	app,
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

const getAlterViewScriptDtos = collection => {
	const modifyViewScriptDtos = getItems(collection.properties?.views?.properties?.modified)
		.map(viewWrapper => Object.values(viewWrapper.properties)[0])
		.map(view => ({ ...view, ...view.role }))
		.flatMap(getModifyViewScriptDtos);

	return [...modifyViewScriptDtos].filter(Boolean);
};

const getAlterRelationshipsScriptDtos = ({ collection, app, ignoreRelationshipIDs = [] }) => {
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

	const deleteFkScriptDtos = getDeleteForeignKeyScriptDtos(deletedRelationships);
	const addFkScriptDtos = getAddForeignKeyScriptDtos(addedRelationships);
	const modifiedFkScriptDtos = getModifyForeignKeyScriptDtos(modifiedRelationships);

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

	const inlineDeltaRelationships = getInlineRelationships({ collection, options: data.options });
	const ignoreRelationshipIDs = inlineDeltaRelationships.map(relationship => relationship.role.id);

	const containersScriptDtos = getAlterContainersScriptDtos({ collection, app });

	const collectionsScriptDtos = getAlterCollectionScriptDtos({
		collection,
		app,
		modelDefinitions,
		internalDefinitions,
		externalDefinitions,
	});

	const viewScriptDtos = getAlterViewScriptDtos(collection);

	const relationshipScriptDtos = getAlterRelationshipsScriptDtos({
		collection,
		app,
		ignoreRelationshipIDs,
	});

	return [...containersScriptDtos, ...collectionsScriptDtos, ...viewScriptDtos, ...relationshipScriptDtos]
		.filter(Boolean)
		.map(dto => dto && prettifyAlterScriptDto(dto))
		.filter(Boolean);
};

module.exports = {
	getAlterScriptDtos,
};
