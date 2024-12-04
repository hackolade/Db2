const { wrapInQuotes } = require('../../../utils/general');
const { getBasicValue } = require('../options/getOptionsByConfigs');

const getIndexName = ({ index }) => {
	const indexName = getBasicValue({ prefix: '', modifier: name => wrapInQuotes({ name }) })(index.indxName);

	return index.schemaName ? ` ${wrapInQuotes({ name: index.schemaName })}.${indexName}` : ` ${indexName}`;
};

module.exports = {
	getIndexName,
};
