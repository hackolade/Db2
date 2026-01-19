/**
 * @typedef {import('../../shared/types').App} App
 * @typedef {import('./types/AlterScriptDto').AlterScriptDto} AlterScriptDto
 */
const { getContainersScripts } = require('./alterScriptHelpers/alterContainerHelper');
const { getEntitiesScripts } = require('./alterScriptHelpers/alterEntityHelper');
const {
	getDeleteForeignKeyScriptDtos,
	getAddForeignKeyScriptDtos,
	getModifyForeignKeyScriptDtos,
} = require('./alterScriptHelpers/alterForeignKeyHelper');
const { getViewsScripts } = require('./alterScriptHelpers/alterViewHelper');

/**
 * @param {T} data
 * @return {Array<T>}
 */
const getItems = data => [data?.items].flat().filter(Boolean);

/**
 * @param {{
 *     collection: Object,
 *     app: App
 * }} param
 */
const getAlterContainersScriptDtos = ({ collection, app }) => {
	const { added, deleted, modified } = collection.properties?.containers?.properties || {};
	const addedContainers = getItems(added);
	const deletedContainers = getItems(deleted);
	const modifiedContainers = getItems(modified);

	const { getAddContainerScriptDto, getDeleteContainerScriptDto, getModifyContainerScriptDto } =
		getContainersScripts(app);

	const addedContainersScriptDtos = addedContainers
		.map(container => Object.values(container.properties)[0])
		.flatMap(getAddContainerScriptDto);

	const deletedContainersScriptDtos = deletedContainers
		.map(container => Object.values(container.properties)[0])
		.flatMap(getDeleteContainerScriptDto);

	const modifiedContainersScriptDtos = modifiedContainers
		.map(containerWrapper => Object.values(containerWrapper.properties)[0])
		.flatMap(getModifyContainerScriptDto);

	// Schemas can only be dropped after all contained tables are removed,
	// so container cleanup must happen last.
	return {
		deletedContainersScriptDtos,
		upsertedContainersScriptDtos: [...addedContainersScriptDtos, ...modifiedContainersScriptDtos],
	};
};

/**
 * @param {{collection: Object, app: App, modelDefinitions: Object, internalDefinitions: Object, externalDefinitions: Object, inlineDeltaRelationships?: any[]}} param
 * @return {Array<AlterScriptDto>}
 */
const getAlterCollectionScriptDtos = ({
	collection,
	app,
	modelDefinitions,
	internalDefinitions,
	externalDefinitions,
	inlineDeltaRelationships = [],
}) => {
	const { added, deleted, modified } = collection.properties?.entities?.properties || {};
	const addedCollections = getItems(added).map(item => Object.values(item.properties)[0]);
	const deletedCollections = getItems(deleted).map(item => Object.values(item.properties)[0]);
	const modifyScriptsData = getItems(modified).map(item => Object.values(item.properties)[0]);

	const {
		getAddCollectionScriptDto,
		getDeleteCollectionScriptDto,
		getModifyCollectionScriptDtos,
		getModifyCollectionKeysScriptDtos,
		getModifyColumnScriptDtos,
		getAddColumnScriptDtos,
		getDeleteColumnScriptDtos,
	} = getEntitiesScripts(app, inlineDeltaRelationships);

	const addedCollectionScriptDtos = addedCollections
		.filter(collection => collection.role.compMod.created)
		.map(getAddCollectionScriptDto);

	const addedColumnScriptDtos = addedCollections.flatMap(getAddColumnScriptDtos);

	const deletedCollectionScriptDtos = deletedCollections
		.filter(collection => collection.role.compMod.deleted)
		.map(getDeleteCollectionScriptDto);

	const deletedColumnScriptDtos = deletedCollections
		.filter(collection => !collection.role.compMod.deleted)
		.flatMap(getDeleteColumnScriptDtos);

	const modifyCollectionScriptDtos = modifyScriptsData.flatMap(getModifyCollectionScriptDtos);
	const modifyCollectionKeysScriptDtos = modifyScriptsData.flatMap(getModifyCollectionKeysScriptDtos);
	const modifyColumnScriptDtos = modifyScriptsData.flatMap(getModifyColumnScriptDtos);

	return [
		...deletedCollectionScriptDtos,
		...addedCollectionScriptDtos,
		...modifyCollectionScriptDtos,
		...deletedColumnScriptDtos,
		...addedColumnScriptDtos,
		...modifyColumnScriptDtos,
		...modifyCollectionKeysScriptDtos,
	].filter(Boolean);
};

/**
 * @param {Object} collection
 * @param {App} app
 * @return {Array<AlterScriptDto>}
 */
const getAlterViewScriptDtos = (collection, app) => {
	const { added, deleted, modified } = collection.properties?.views?.properties || {};
	const { getAddViewScriptDto, getDeleteViewScriptDto, getModifyViewScriptDtos } = getViewsScripts(app);

	const addedViews = getItems(added)
		.map(item => Object.values(item.properties)[0])
		.map(view => ({ ...view, ...view.role }))
		.filter(view => view.compMod?.created);

	const deletedViews = getItems(deleted)
		.map(item => Object.values(item.properties)[0])
		.map(view => ({ ...view, ...view.role }))
		.filter(view => view.compMod?.deleted);

	const modifiedViews = getItems(modified)
		.map(item => Object.values(item.properties)[0])
		.map(view => ({ ...view, ...view.role }));

	const addedViewScriptDtos = addedViews.map(getAddViewScriptDto);
	const deletedViewScriptDtos = deletedViews.map(getDeleteViewScriptDto);
	const modifyViewScriptDtos = modifiedViews.flatMap(getModifyViewScriptDtos);

	return [...deletedViewScriptDtos, ...addedViewScriptDtos, ...modifyViewScriptDtos].filter(Boolean);
};

/**
 * @param {{collection: Object, app: App, ignoreRelationshipIDs?: string[]}} param
 * @return {Array<AlterScriptDto>}
 */
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

/**
 * @param {{collection: Object, options: Object}} param
 * @return {Array<Object>}
 */
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

/**
 * @param {AlterScriptDto} dto
 * @return {AlterScriptDto | undefined}
 */
const prettifyAlterScriptDto = dto => {
	if (!dto) {
		return undefined;
	}
	/**
	 * @type {Array<ModificationScript>}
	 */
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

/**
 * @param {Object} data
 * @param {App} app
 * @return {Array<AlterScriptDto>}
 */
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

	const { deletedContainersScriptDtos, upsertedContainersScriptDtos } = getAlterContainersScriptDtos({
		collection,
		app,
	});

	const collectionsScriptDtos = getAlterCollectionScriptDtos({
		collection,
		app,
		modelDefinitions,
		internalDefinitions,
		externalDefinitions,
		inlineDeltaRelationships,
	});

	const viewScriptDtos = getAlterViewScriptDtos(collection, app);

	const relationshipScriptDtos = getAlterRelationshipsScriptDtos({
		collection,
		app,
		ignoreRelationshipIDs,
	});

	return [
		...upsertedContainersScriptDtos,
		...collectionsScriptDtos,
		...viewScriptDtos,
		...relationshipScriptDtos,
		...deletedContainersScriptDtos,
	]
		.filter(Boolean)
		.map(dto => dto && prettifyAlterScriptDto(dto))
		.filter(Boolean);
};

module.exports = {
	getAlterScriptDtos,
};
