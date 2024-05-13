const { getNamePrefixedWithSchemaName } = require('../../../utils/general');
const { getName, getIdToNameHashTable } = require('../jsonSchema/jsonSchemaHelper');

/**
 * @param {{ tableData: object, detailsTab: object }}
 * @returns {{
 * auxiliary?: boolean,
 * auxiliaryAppend?: string,
 * auxiliaryPart?: number,
 * auxiliaryBaseTable?: string,
 * auxiliaryBaseColumn?: string,
 * }}
 */
const hydrateAuxiliaryTableData = ({ tableData, detailsTab }) => {
	if (!detailsTab.auxiliary) {
		return {};
	}

	const auxiliaryBaseTableJsonSchema = tableData.relatedSchemas?.[detailsTab.auxiliaryBaseTable];
	const auxiliaryBaseTableSchemaName = auxiliaryBaseTableJsonSchema?.bucketName;
	const idToNameHashTable = getIdToNameHashTable({ jsonSchema: auxiliaryBaseTableJsonSchema });
	const auxiliaryBaseTableName = getName({ item: auxiliaryBaseTableJsonSchema });
	const auxiliaryBaseTable =
		auxiliaryBaseTableName &&
		getNamePrefixedWithSchemaName({
			name: auxiliaryBaseTableName,
			schemaName: auxiliaryBaseTableSchemaName,
		});
	const auxiliaryBaseColumn = idToNameHashTable[detailsTab.auxiliaryBaseColumn?.[0]?.keyId];

	return {
		auxiliary: detailsTab.auxiliary,
		auxiliaryAppend: detailsTab.auxiliaryAppend,
		auxiliaryPart: detailsTab.auxiliaryPart,
		auxiliaryBaseTable,
		auxiliaryBaseColumn,
	};
};

module.exports = {
	hydrateAuxiliaryTableData,
};
