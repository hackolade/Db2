module.exports = {
	createSchema: 'CREATE SCHEMA${ifNotExists} ${schemaName}${authorization}${dataCapture};',

	createTable: 'CREATE${tableType} TABLE${ifNotExists} ${name}${tableProps}${tableOptions};',

	comment: '\nCOMMENT ON ${objectType} ${objectName} IS ${comment};\n',

	createTableProps: '${columns}${keyConstraints}${checkConstraints}${foreignKeyConstraints}',
};
