/**
 * @param {string} name
 * @returns {boolean}
 */
const isViewName = name => / \(v\)$/i.test(name);

/**
 * @param {string} name
 * @returns {string}
 */
const setViewSign = name => `${name} (v)`;

/**
 * @param {string} name
 * @returns {string}
 */
const getViewName = name => name.replace(/ \(v\)$/i, '');

const nameHelper = {
	getViewName,
	isViewName,
	setViewSign,
};

module.exports = {
	nameHelper,
};
