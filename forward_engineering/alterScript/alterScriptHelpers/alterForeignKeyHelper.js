const _ = require('lodash');
const { AlterScriptDto } = require('../types/AlterScriptDto');
const { getNamePrefixedWithSchemaName, wrapInQuotes, removeAllQuotes } = require('../../utils/general');
const { CONSTRAINT_POSTFIX } = require('../../../constants/constants');
const templates = require('../../ddlProvider/templates');
const { assignTemplates } = require('../../utils/assignTemplates');

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

const getAddSingleForeignKeyStatementDto = relationship => {
	const compMod = relationship.role.compMod;

	const relationshipName = getRelationshipName(relationship);
	const ddlProvider = require('../../ddlProvider/ddlProvider')();

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

const getAddForeignKeyScriptDtos = addedRelationships => {
	return addedRelationships
		.filter(relationship => canRelationshipBeAdded(relationship))
		.map(relationship => {
			const scriptDto = getAddSingleForeignKeyStatementDto(relationship);
			return AlterScriptDto.getInstance([scriptDto.statement], scriptDto.isActivated, false);
		})
		.filter(res => res?.scripts.some(scriptDto => Boolean(scriptDto.script)));
};

const getDeleteSingleForeignKeyStatementDto = relationship => {
	const compMod = relationship.role.compMod;

	const tableName = getFullChildTableName(relationship);

	const relationshipName = getRelationshipName(relationship);
	const fkConstraintName = wrapInQuotes(relationshipName);
	const statement = assignTemplates({
		template: templates.dropForeignKey,
		templateData: {
			tableName,
			fkConstraintName,
		},
	});

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

const getDeleteForeignKeyScriptDtos = deletedRelationships => {
	return deletedRelationships
		.filter(relationship => canRelationshipBeDeleted(relationship))
		.map(relationship => {
			const scriptDto = getDeleteSingleForeignKeyStatementDto(relationship);
			return AlterScriptDto.getInstance([scriptDto.statement], scriptDto.isActivated, true);
		})
		.filter(res => res?.scripts.some(scriptDto => Boolean(scriptDto.script)));
};

const getModifyForeignKeyScriptDtos = modifiedRelationships => {
	return modifiedRelationships
		.filter(relationship => canRelationshipBeAdded(relationship) && canRelationshipBeDeleted(relationship))
		.map(relationship => {
			const deleteScriptDto = getDeleteSingleForeignKeyStatementDto(relationship);
			const addScriptDto = getAddSingleForeignKeyStatementDto(relationship);
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
