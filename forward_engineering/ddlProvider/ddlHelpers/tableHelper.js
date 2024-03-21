module.exports = ({ _, getColumnsList, checkAllKeysDeactivated }) => {
	const getTableTemporaryValue = (temporary, unlogged) => {
		if (temporary) {
			return ' TEMPORARY';
		}

		if (unlogged) {
			return ' UNLOGGED';
		}

		return '';
	};

	const getTableOptions = tableData => {
		const wrap = value => (value ? `${value}\n` : '');

		const statements = [
			{ key: 'inherits', getValue: getBasicValue('INHERITS') },
			{ key: 'partitioning', getValue: getPartitioning },
			{ key: 'usingMethod', getValue: getBasicValue('USING') },
			{ key: 'table_tablespace_name', getValue: getBasicValue('TABLESPACE') },
			{ key: 'selectStatement', getValue: getBasicValue('AS') },
		]
			.map(config => wrap(config.getValue(tableData[config.key], tableData)))
			.filter(Boolean)
			.join('');

		return _.trim(statements) ? ` ${_.trim(statements)}` : '';
	};

	const getPartitioning = (value, { isActivated }) => {
		if (value && value.partitionMethod) {
			const expression =
				value.partitionBy === 'keys'
					? getPartitionKeys(value, isActivated)
					: ` (${value.partitioning_expression})`;

			return `PARTITION BY ${value.partitionMethod}${expression}`;
		}
	};

	const getPartitionKeys = (value, isParentActivated) => {
		const isAllColumnsDeactivated = checkAllKeysDeactivated(value.compositePartitionKey);

		return getColumnsList(value.compositePartitionKey, isAllColumnsDeactivated, isParentActivated);
	};

	const getBasicValue = prefix => value => {
		if (value) {
			return `${prefix} ${value}`;
		}
	};

	return {
		getTableTemporaryValue,
		getTableOptions,
	};
};
