const { wrapInQuotes } = require('../../../utils/general');
const { getBasicValue } = require('../options/getOptionsByConfigs');

const getIndexName = ({ index }) => {
	const indexName = getBasicValue({ prefix: '', modifier: wrapInQuotes })(index.indxName);

	return index.schemaName ? ` ${wrapInQuotes(index.schemaName)}.${indexName}` : ` ${indexName}`;
};

module.exports = {
	getIndexName,
};
