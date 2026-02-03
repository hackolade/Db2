const { isEqual } = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getSchemaNameFromCollection,
	getNamePrefixedWithSchemaName,
	wrapInQuotes,
	getSchemaOfAlterCollection,
	getEntityName,
	isObjectInDeltaModelActivated,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');
const { getIndexCommentsScriptDtos, getModifyIndexCommentsScriptDtos } = require('../indexHelpers/commentsHelper');
const { addNameToIndexKey } = require('../indexHelpers/addNameToIndexKey');

const alterIndexProperties = ['indxCompress'];
const columnProperties = ['indxKey', 'indxIncludeKey'];
// Temporary always drop and recreate index if any of these properties changed
const dropAndRecreateIndexProperties = [
	'indxType',
	'indxTablespace',
	'indxNullKeys',
	...alterIndexProperties,
	...columnProperties,
];

/**
 * @param {{
 *  oldIndex: Object,
 *  newIndex: Object
 * }} param
 * @return {boolean}
 */
const shouldDropAndRecreateIndex = ({ oldIndex, newIndex }) => {
	return dropAndRecreateIndexProperties.some(property => !isEqual(oldIndex[property], newIndex[property]));
};

/**
 * @param {{
 *  oldIndex: Object,
 *  newIndex: Object
 * }} param
 * @return {boolean}
 */
const areOldIndexDtoAndNewIndexDtoDescribingSameDatabaseIndex = ({ oldIndex, newIndex }) => {
	return oldIndex.id === newIndex.id || oldIndex.indxName === newIndex.indxName;
};

/**
 * @param {{
 *  schemaName: string,
 *  oldIndexName: string,
 *  newIndexName: string,
 *  isActivated: boolean
 * }} param
 * @return {AlterScriptDto}
 */
const alterIndexRenameDto = ({ schemaName, oldIndexName, newIndexName, isActivated }) => {
	const ddlOldIndexName = getNamePrefixedWithSchemaName({
		name: oldIndexName,
		schemaName,
	});
	const ddlNewIndexName = wrapInQuotes(newIndexName);

	const script = assignTemplates({
		template: templates.renameIndex,
		templateData: {
			oldIndexName: ddlOldIndexName,
			newIndexName: ddlNewIndexName,
		},
	});

	return AlterScriptDto.getInstance([script], isActivated, false);
};

/**
 * @param {{
 *  index: Object,
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {AlterScriptDto | undefined}
 */
const getCreateIndexScriptDto = ({ index, collection, ddlProvider }) => {
	const indexWithAddedKeyNames = addNameToIndexKey({ index, collection });
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getEntityName(collectionSchema);

	const script = ddlProvider.createIndex(tableName, indexWithAddedKeyNames);
	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {{
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {Array<AlterScriptDto>}
 */
const getAddedIndexesScriptDtos = ({ collection, ddlProvider }) => {
	const newIndexes = collection?.role?.Indxs || [];
	const oldIndexes = collection?.role?.compMod?.Indxs?.old || [];

	return newIndexes
		.filter(newIndex => {
			const correspondingOldIndex = oldIndexes.find(oldIndex =>
				areOldIndexDtoAndNewIndexDtoDescribingSameDatabaseIndex({
					oldIndex,
					newIndex,
				}),
			);
			return !correspondingOldIndex;
		})
		.map(newIndex => {
			return getCreateIndexScriptDto({
				index: newIndex,
				collection,
				ddlProvider,
			});
		})
		.filter(Boolean);
};

/**
 * @param {{
 *  index: Object,
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {AlterScriptDto | undefined}
 */
const getDeleteIndexScriptDto = ({ index, collection, ddlProvider }) => {
	const schemaName = getSchemaNameFromCollection({ collection });
	const fullIndexName = getNamePrefixedWithSchemaName({
		name: index.indxName,
		schemaName,
	});
	const script = ddlProvider.dropIndex(fullIndexName);
	return AlterScriptDto.getInstance([script], index.isActivated && isObjectInDeltaModelActivated(collection), true);
};

/**
 * @param {{
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {Array<AlterScriptDto>}
 */
const getDeletedIndexesScriptDtos = ({ collection, ddlProvider }) => {
	const newIndexes = collection?.role?.compMod?.Indxs?.new || [];
	const oldIndexes = collection?.role?.compMod?.Indxs?.old || [];

	return oldIndexes
		.filter(oldIndex => {
			const correspondingNewIndex = newIndexes.find(newIndex =>
				areOldIndexDtoAndNewIndexDtoDescribingSameDatabaseIndex({
					oldIndex,
					newIndex,
				}),
			);
			return !correspondingNewIndex;
		})
		.map(oldIndex => {
			return getDeleteIndexScriptDto({ index: oldIndex, collection, ddlProvider });
		})
		.filter(Boolean);
};

/**
 * @param {{
 *  newIndex: Object,
 *  oldIndex: Object,
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {Array<AlterScriptDto>}
 */
const getModifyIndexScriptDto = ({ newIndex, oldIndex, collection, ddlProvider }) => {
	const scripts = [];

	const shouldDropAndRecreate = shouldDropAndRecreateIndex({ newIndex, oldIndex });
	if (shouldDropAndRecreate) {
		const deleteIndexScriptDto = getDeleteIndexScriptDto({
			index: oldIndex,
			collection,
			ddlProvider,
		});
		const createIndexScriptDto = getCreateIndexScriptDto({
			index: newIndex,
			collection,
			ddlProvider,
		});
		// if an index was recreated, and comment was removed,
		// no need to generate separate script to drop comment
		scripts.push(deleteIndexScriptDto, createIndexScriptDto);

		if (newIndex.indxDescription) {
			const commentDtos = getIndexCommentsScriptDtos({
				index: newIndex,
				collection,
			});
			scripts.push(...commentDtos);
		}

		return scripts;
	}

	if (oldIndex.indxName !== newIndex.indxName) {
		const schemaName = getSchemaNameFromCollection({ collection });
		const renameScript = alterIndexRenameDto({
			schemaName,
			oldIndexName: oldIndex.indxName,
			newIndexName: newIndex.indxName,
			isActivated: isObjectInDeltaModelActivated(collection) && newIndex.isActivated,
		});

		scripts.push(renameScript);
	}

	const commentDtos = getModifyIndexCommentsScriptDtos({ newIndex, oldIndex, collection });

	if (commentDtos) {
		scripts.push(commentDtos);
	}

	return scripts;
};

/**
 * @param {{
 *  collection: Object,
 *  ddlProvider: Object
 * }} param
 * @return {Array<AlterScriptDto>}
 */
const getModifiedIndexesScriptDtos = ({ collection, ddlProvider }) => {
	const newIndexes = collection?.role?.compMod?.Indxs?.new || [];
	const oldIndexes = collection?.role?.compMod?.Indxs?.old || [];

	return newIndexes
		.map(newIndex => {
			const correspondingOldIndex = oldIndexes.find(oldIndex =>
				areOldIndexDtoAndNewIndexDtoDescribingSameDatabaseIndex({
					oldIndex,
					newIndex,
				}),
			);
			if (correspondingOldIndex) {
				return {
					newIndex,
					oldIndex: correspondingOldIndex,
				};
			}
			return undefined;
		})
		.filter(Boolean)
		.flatMap(({ newIndex, oldIndex }) => {
			return getModifyIndexScriptDto({
				newIndex,
				oldIndex,
				collection,
				ddlProvider,
			});
		})
		.filter(Boolean);
};

/**
 * @param {{
 *  ddlProvider: Object,
 *  collection: Object
 * }} param
 * @return {Array<AlterScriptDto>}
 */
const getModifyIndexesScriptDtos = ({ ddlProvider, collection }) => {
	const deletedIndexesScriptDtos = getDeletedIndexesScriptDtos({
		collection,
		ddlProvider,
	});
	const addedIndexesScriptDtos = getAddedIndexesScriptDtos({
		collection,
		ddlProvider,
	});
	const modifiedIndexesScriptDtos = getModifiedIndexesScriptDtos({
		collection,
		ddlProvider,
	});

	return [...deletedIndexesScriptDtos, ...addedIndexesScriptDtos, ...modifiedIndexesScriptDtos].filter(Boolean);
};

module.exports = {
	getModifyIndexesScriptDtos,
};
