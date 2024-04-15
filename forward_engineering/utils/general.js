const _ = require('lodash');

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
	return Object.keys(descriptors).map(_.toLower).includes(_.toLower(type));
};

/**
 * @param {{ keys: object[] }}
 * @returns {boolean}
 */
const checkAllKeysDeactivated = ({ keys }) => {
	return keys.length ? keys.every(key => !_.get(key, 'isActivated', true)) : false;
};

/**
 * @template {object} T
 * @template {any} K
 * @param {{ items: T[], mapFunction: (item: T) => K }}
 * @returns {{ activatedItems: K[], deactivatedItems: K[]}}
 */
const divideIntoActivatedAndDeactivated = ({ items, mapFunction }) => {
	const activatedItems = items.filter(item => _.get(item, 'isActivated', true)).map(mapFunction);
	const deactivatedItems = items.filter(item => !_.get(item, 'isActivated', true)).map(mapFunction);

	return { activatedItems, deactivatedItems };
};

const commentIfDeactivated = (statement, { isActivated, isPartOfLine, inlineComment = '--' }) => {
	if (isActivated !== false) {
		return statement;
	}
	if (isPartOfLine) {
		return '/* ' + statement + ' */';
	} else if (statement.includes('\n')) {
		return '/*\n' + statement + ' */\n';
	} else {
		return inlineComment + ' ' + statement;
	}
};

const wrap = (str, start = "'", end = "'") => {
	const firstChar = str[0];
	const lastChar = str[str.length - 1];

	if (lastChar === start && firstChar === end) {
		return str;
	} else {
		return `${start}${str}${end}`;
	}
};

const wrapInQuotes = name => `"${name}"`;

/**
 * @param {{ name: string, schemaName?: string }}
 * @returns {string}
 */
const getNamePrefixedWithSchemaName = ({ name, schemaName }) => {
	if (schemaName) {
		return `${wrapInQuotes(schemaName)}.${wrapInQuotes(name)}`;
	}

	return wrapInQuotes(name);
};

const checkFieldPropertiesChanged = (compMod, propertiesToCheck) => {
	return propertiesToCheck.some(prop => compMod?.oldField[prop] !== compMod?.newField[prop]);
};

const columnMapToString = ({ name }) => wrapInQuotes(name);

const getColumnsList = (columns, isAllColumnsDeactivated, isParentActivated, mapColumn = columnMapToString) => {
	const dividedColumns = divideIntoActivatedAndDeactivated(columns, mapColumn);
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
 * @param str {string}
 * @return {string}
 * */
const escapeSingleQuote = str => {
	return str.replaceAll("'", "''");
};

const getGroupItemsByCompMode = ({ newItems = [], oldItems = [] }) => {
	const addedItems = newItems.filter(newItem => !oldItems.some(item => item.id === newItem.id));
	const removedItems = [];
	const modifiedItems = [];

	oldItems.forEach(oldItem => {
		const newItem = newItems.find(item => item.id === oldItem.id);

		if (!newItem) {
			removedItems.push(oldItem);
		} else if (!_.isEqual(newItem, oldItem)) {
			modifiedItems.push(newItem);
		}
	});

	return {
		added: addedItems,
		removed: removedItems,
		modified: modifiedItems,
	};
};
const toArray = val => (_.isArray(val) ? val : [val]);

module.exports = {
	setTab,
	hasType,
	checkAllKeysDeactivated,
	divideIntoActivatedAndDeactivated,
	commentIfDeactivated,
	wrap,
	wrapInQuotes,
	getNamePrefixedWithSchemaName,
	checkFieldPropertiesChanged,
	getColumnsList,
	escapeSingleQuote,
	getGroupItemsByCompMode,
	toArray,
};
