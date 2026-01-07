const _ = require('lodash');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { getNamePrefixedWithSchemaName, wrapInQuotes, removeAllQuotes } = require('../../utils/general');
const { CONSTRAINT_POSTFIX } = require('../../../constants/constants');

const getRelationshipName = relationship => {
	const compMod = relationship.role.compMod;
	const name = compMod.code?.new || compMod.name?.new || relationship.role.code || relationship.role.name;
	return name;
};

const getFullChildTableName = relationship => {
	const compMod = relationship.role.compMod;

	const childBucketName = compMod.child.bucket.name;
	const childEntityName = compMod.child.collection.name;
	return getNamePrefixedWithSchemaName({ name: childEntityName, schemaName: childBucketName });
};

const getAddSingleForeignKeyStatementDto = ddlProvider => relationship => {
	const compMod = relationship.role.compMod;

	const relationshipName = getRelationshipName(relationship);

	return ddlProvider.createForeignKey({
		name: relationshipName,
		foreignKey: compMod.child.collection.fkFields,
		primaryKey: compMod.parent.collection.fkFields,
		customProperties: compMod.customProperties?.new,
		foreignTable: compMod.child.collection.name,
		foreignSchemaName: compMod.child.bucket.name,
		foreignTableActivated: compMod.child.collection.isActivated,
		primaryTable: compMod.parent.collection.name,
		primarySchemaName: compMod.parent.bucket.name,
		primaryTableActivated: compMod.parent.collection.isActivated,
		isActivated: Boolean(relationship.role?.compMod?.isActivated?.new),
	});
};

const canRelationshipBeAdded = relationship => {
	const compMod = relationship.role.compMod;
	if (!compMod) {
		return false;
	}
	return [
		getRelationshipName(relationship),
		compMod.parent?.bucket,
		compMod.parent?.collection,
		compMod.parent?.collection?.fkFields?.length,
		compMod.child?.bucket,
		compMod.child?.collection,
		compMod.child?.collection?.fkFields?.length,
	].every(Boolean);
};

const getAddForeignKeyScriptDtos = ddlProvider => addedRelationships => {
	return addedRelationships
		.filter(relationship => canRelationshipBeAdded(relationship))
		.map(relationship => {
			const scriptDto = getAddSingleForeignKeyStatementDto(ddlProvider)(relationship);
			return AlterScriptDto.getInstance([scriptDto.statement], scriptDto.isActivated, false);
		})
		.filter(res => res?.scripts.some(scriptDto => Boolean(scriptDto.script)));
};

const getDeleteSingleForeignKeyStatementDto = ddlProvider => relationship => {
	const compMod = relationship.role.compMod;

	const ddlChildEntityName = getFullChildTableName(relationship);

	const relationshipName = getRelationshipName(relationship);
	const ddlRelationshipName = wrapInQuotes(relationshipName);
	const statement = ddlProvider.dropForeignKey(ddlChildEntityName, ddlRelationshipName);

	const isRelationshipActivated = Boolean(relationship.role?.compMod?.isActivated?.new);
	const isChildTableActivated = compMod.child.collection.isActivated;
	return {
		statement,
		isActivated: isRelationshipActivated && isChildTableActivated,
	};
};

const canRelationshipBeDeleted = relationship => {
	const compMod = relationship.role.compMod;
	if (!compMod) {
		return false;
	}
	return [compMod.code?.old || compMod.name?.old, compMod.child?.bucket, compMod.child?.collection].every(Boolean);
};

const getDeleteForeignKeyScriptDtos = ddlProvider => deletedRelationships => {
	return deletedRelationships
		.filter(relationship => canRelationshipBeDeleted(relationship))
		.map(relationship => {
			const scriptDto = getDeleteSingleForeignKeyStatementDto(ddlProvider)(relationship);
			return AlterScriptDto.getInstance([scriptDto.statement], scriptDto.isActivated, true);
		})
		.filter(res => res?.scripts.some(scriptDto => Boolean(scriptDto.script)));
};

const getModifyForeignKeyScriptDtos = ddlProvider => modifiedRelationships => {
	return modifiedRelationships
		.filter(relationship => canRelationshipBeAdded(relationship) && canRelationshipBeDeleted(relationship))
		.map(relationship => {
			const deleteScriptDto = getDeleteSingleForeignKeyStatementDto(ddlProvider)(relationship);
			const addScriptDto = getAddSingleForeignKeyStatementDto(ddlProvider)(relationship);
			const isActivated = addScriptDto.isActivated && deleteScriptDto.isActivated;
			return AlterScriptDto.getDropAndRecreateInstance(
				deleteScriptDto.statement,
				addScriptDto.statement,
				isActivated,
			);
		})
		.filter(res => res?.scripts.some(scriptDto => Boolean(scriptDto.script)));
};

module.exports = {
	getDeleteForeignKeyScriptDtos,
	getModifyForeignKeyScriptDtos,
	getAddForeignKeyScriptDtos,
};
