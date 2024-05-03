const { wrapInQuotes } = require('../../../utils/general');
const { getBasicValue } = require('../options/getOptionsByConfigs');

const getIndexName = ({ index }) => {
	return getBasicValue({ prefix: ' ', modifier: name => wrapInQuotes({ name }) })(index.indxName);
};

module.exports = {
	getIndexName,
};
