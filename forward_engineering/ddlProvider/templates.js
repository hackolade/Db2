module.exports = {
	createSchema: 'CREATE SCHEMA${ifNotExists} ${schemaName}${authorization}${dataCapture};',

	createTable: 'CREATE${tableType} TABLE${ifNotExists} ${name}${tableProps}${tableOptions};',

	createAuxiliaryTable: 'CREATE${tableType} TABLE ${name}${tableOptions};',

	comment: '\nCOMMENT ON ${objectType} ${objectName} IS ${comment};\n',

	createTableProps: '${columns}${keyConstraints}${checkConstraints}${foreignKeyConstraints}',

	columnDefinition: '${name}${type}${default}${encrypt}${constraints}',

	createForeignKey:
		'ALTER TABLE ${foreignTable} ADD CONSTRAINT ${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete};',

	createForeignKeyConstraint:
		'${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete}',

	checkConstraint: '${name}CHECK (${expression})',

	createKeyConstraint: '${constraintName}${keyType}${columns}${options}',

	createView: 'CREATE${orReplace} VIEW ${name} ${viewProperties}\n\tAS ${selectStatement};',

	viewSelectStatement: 'SELECT ${keys}\n\tFROM ${tableName}',

	createIndex: 'CREATE${indexType} INDEX${indexName} ON ${indexTableName}${indexOptions};\n',
};
