const { toUpper } = require('lodash');
const { getBasicValue } = require('../options/getOptionsByConfigs');

const getIndexType = ({ index }) => {
	return getBasicValue({ prefix: ' ', modifier: toUpper })(index.indxType);
};

module.exports = {
	getIndexType,
};
