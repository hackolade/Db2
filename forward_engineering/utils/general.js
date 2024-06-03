const { toLower } = require('lodash');

/**
 * @param {{ text: string, tab: string }}
 * @returns {string}
 */
const setTab = ({ text, tab = '\t' }) => {
	return text
		.split('\n')
		.map(line => tab + line)
		.join('\n');
};

/**
 * @param {{ descriptors: object, type: string }}
 * @returns {boolean}
 */
const hasType = ({ descriptors, type }) => {
	return Object.keys(descriptors).map(toLower).includes(toLower(type));
};

/**
 * @param {{ key?: object }}
 * @returns {boolean}
 */
const checkIsKeyActivated = ({ key }) => {
	return key?.isActivated ?? true;
};

/**
 * @param {{ keys: object[] }}
 * @returns {boolean}
 */
const checkAllKeysDeactivated = ({ keys }) => {
	return keys.length ? keys.every(key => !checkIsKeyActivated({ key })) : false;
};

/**
 * @template {object} T
 * @template {any} K
 * @param {{ items: T[], mapFunction: (item: T) => K }}
 * @returns {{ activatedItems: K[], deactivatedItems: K[]}}
 */
const divideIntoActivatedAndDeactivated = ({ items, mapFunction }) => {
	const activatedItems = items.filter(item => checkIsKeyActivated({ key: item })).map(mapFunction);
	const deactivatedItems = items.filter(item => !checkIsKeyActivated({ key: item })).map(mapFunction);

	return { activatedItems, deactivatedItems };
};

/**
 * @param {string} statement
 * @param {{ isActivated: boolean, isPartOfLine: boolean, inlineComment: string }}
 * @returns {string}
 */
const commentIfDeactivated = (statement, { isActivated, isPartOfLine, inlineComment = '--' }) => {
	if (isActivated !== false) {
		return statement;
	}

	if (isPartOfLine) {
		return '/* ' + statement + ' */';
	}

	if (statement.includes('\n')) {
		return '/*\n' + statement + ' */\n';
	}
	return inlineComment + ' ' + statement;
};

/**
 * @param {{ name: string }}
 * @returns {string}
 */
const wrapInQuotes = ({ name }) => `"${name}"`;

/**
 * @param {{ name: string }}
 * @returns {string}
 */
const wrapInSingleQuotes = ({ name }) => `'${name}'`;

/**
 * @param {{ name: string, schemaName?: string }}
 * @returns {string}
 */
const getNamePrefixedWithSchemaName = ({ name, schemaName }) => {
	if (schemaName) {
		return `${wrapInQuotes({ name: schemaName })}.${wrapInQuotes({ name })}`;
	}

	return wrapInQuotes({ name });
};

const columnMapToString = ({ name }) => wrapInQuotes({ name });

const getColumnsList = (columns, isAllColumnsDeactivated, isParentActivated, mapColumn = columnMapToString) => {
	const dividedColumns = divideIntoActivatedAndDeactivated({ items: columns, mapFunction: mapColumn });
	const deactivatedColumnsAsString = dividedColumns?.deactivatedItems?.length
		? commentIfDeactivated(dividedColumns.deactivatedItems.join(', '), {
				isActivated: false,
				isPartOfLine: true,
			})
		: '';

	return !isAllColumnsDeactivated && isParentActivated
		? ' (' + dividedColumns.activatedItems.join(', ') + deactivatedColumnsAsString + ')'
		: ' (' + columns.map(mapColumn).join(', ') + ')';
};

/**
 * @template {object} T
 * @param {{ value: T | T[] }}
 * @returns {T[]}
 */
const toArray = ({ value }) => (Array.isArray(value) ? value : [value]);

module.exports = {
	setTab,
	hasType,
	checkAllKeysDeactivated,
	checkIsKeyActivated,
	divideIntoActivatedAndDeactivated,
	commentIfDeactivated,
	wrapInQuotes,
	wrapInSingleQuotes,
	getNamePrefixedWithSchemaName,
	getColumnsList,
	toArray,
};
