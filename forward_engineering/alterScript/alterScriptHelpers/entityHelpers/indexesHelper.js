const _ = require('lodash');
const { AlterScriptDto } = require('../../types/AlterScriptDto');
const {
	getSchemaNameFromCollection,
	getNamePrefixedWithSchemaName,
	wrapInQuotes,
	getSchemaOfAlterCollection,
	getFullCollectionName,
	getEntityName,
	isEntityActivated,
} = require('../../../utils/general');
const { assignTemplates } = require('../../../utils/assignTemplates');
const templates = require('../../../ddlProvider/templates');
const { getIndexCommentsScriptDtos, getModifyIndexCommentsScriptDtos } = require('../indexHelpers/commentsHelper');

/**
 * @param {string} columnId
 * @param {Object} collection
 * @return {string | undefined}
 * */
const getColumnNameById = ({ columnId, collection }) => {
	const collectionProperties = _.toPairs(collection?.role?.properties || collection?.properties || {}).map(
		([name, value]) => ({ ...value, name }),
	);
	const oldProperties = (collection?.role?.compMod?.oldProperties || []).map(property => ({
		...property,
		GUID: property.id,
	}));
	const properties = collectionProperties.length > 0 ? collectionProperties : oldProperties;
	const propertySchema = properties.find(fieldJsonSchema => fieldJsonSchema.GUID === columnId);

	if (propertySchema) {
		return propertySchema.name;
	}

	return undefined;
};

/**
 * @param {AlterIndexDto} index
 * @param {Object} collection
 * @return {Object}
 * */
const addNameToIndexKey = ({ index, collection }) => {
	if (!index?.indxKey?.length) {
		return index;
	}

	const schemaName = getSchemaNameFromCollection({ collection });

	const columnsWithNames = index.indxKey
		.map(column => {
			return {
				...column,
				name: getColumnNameById({ columnId: column.keyId, collection }),
			};
		})
		.filter(column => Boolean(column.name));

	return {
		...index,
		schemaName,
		indxKey: columnsWithNames,
	};
};

const alterIndexRebuildProperties = ['indxCompress'];
const columnProperties = ['indxKey', 'indxIncludeKey'];
// Temporary always drop and recreate index if any of these properties changed
const dropAndRecreateIndexProperties = [
	'indxType',
	'indxTablespace',
	'indxNullKeys',
	...alterIndexRebuildProperties,
	...columnProperties,
];

const shouldDropAndRecreateIndex = ({ oldIndex, newIndex }) => {
	return dropAndRecreateIndexProperties.some(property => !_.isEqual(oldIndex[property], newIndex[property]));
};

/**
 * @param {AlterIndexDto} oldIndex
 * @param {AlterIndexDto} newIndex
 * @return {boolean}
 * */
const areOldIndexDtoAndNewIndexDtoDescribingSameDatabaseIndex = ({ oldIndex, newIndex }) => {
	return oldIndex.id === newIndex.id || oldIndex.indxName === newIndex.indxName;
};

/**
 * @param {string} schemaName
 * @param {string} oldIndexName
 * @param {string} newIndexName
 * @param {boolean} isActivated
 * @return {string}
 * */
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
 * @param {AlterIndexDto} index
 * @param {Object} collection
 * @param {Object} additionalDataForDdlProvider
 * @return {AlterScriptDto | undefined}
 * */
const getCreateIndexScriptDto = ({ index, collection, ddlProvider }) => {
	const indexWithAddedKeyNames = addNameToIndexKey({ index, collection });
	const collectionSchema = getSchemaOfAlterCollection(collection);
	const tableName = getEntityName(collectionSchema);

	const script = ddlProvider.createIndex(tableName, indexWithAddedKeyNames);
	return AlterScriptDto.getInstance([script], true, false);
};

/**
 * @param {Object} collection
 * @param {Object} additionalDataForDdlProvider
 * @return {Array<AlterScriptDto>}
 * */
const getAddedIndexesScriptDtos =
	ddlProvider =>
	({ collection }) => {
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

const getDeleteIndexScriptDto = ({ index, collection, ddlProvider }) => {
	const schemaName = getSchemaNameFromCollection({ collection });
	const isParentActivated = isEntityActivated(collection);

	const fullIndexName = getNamePrefixedWithSchemaName({
		name: index.indxName,
		schemaName,
	});
	const script = ddlProvider.dropIndex(fullIndexName);
	const isIndexActivated = index.isActivated && isParentActivated;
	return AlterScriptDto.getInstance([script], isIndexActivated, true);
};

/**
 * @param {Object} collection
 * @param {Object} additionalDataForDdlProvider
 * @return {Array<AlterScriptDto>}
 * */
const getDeletedIndexesScriptDtos =
	ddlProvider =>
	({ collection }) => {
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
			isActivated: isEntityActivated(collection) && newIndex.isActivated,
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
 * @param {Object} collection
 * @param {Object} additionalDataForDdlProvider
 * @return {Array<AlterScriptDto>}
 * */
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
 * @param {Object} collection
 * @return {Array<AlterScriptDto>}
 * */
const getModifyIndexesScriptDtos = ({ ddlProvider, collection }) => {
	const deletedIndexesScriptDtos = getDeletedIndexesScriptDtos(ddlProvider)({
		collection,
	});
	const addedIndexesScriptDtos = getAddedIndexesScriptDtos(ddlProvider)({
		collection,
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
