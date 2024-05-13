/**
 * @param {{ auxiliary?: boolean, temporary?: boolean }}
 * @returns {string}
 */
const getTableType = ({ auxiliary, temporary }) => {
	switch (true) {
		case auxiliary:
			return ' AUXILIARY';
		case temporary:
			return ' GLOBAL TEMPORARY';
		default:
			return '';
	}
};

module.exports = {
	getTableType,
};
