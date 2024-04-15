module.exports = {
	createSchema: 'CREATE SCHEMA${ifNotExists} ${schemaName}${authorization}${dataCapture};',

	createTable: 'CREATE${tableType} TABLE${ifNotExists} ${name}${tableProps}${tableOptions};',

	comment: '\nCOMMENT ON ${objectType} ${objectName} IS ${comment};\n',

	createTableProps: '${columns}${keyConstraints}${checkConstraints}${foreignKeyConstraints}',

	columnDefinition: '${name}${type}${default}${encrypt}${constraints}',

	createForeignKey:
		'ALTER TABLE ${foreignTable} ADD CONSTRAINT ${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete};',

	createForeignKeyConstraint:
		'${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete}',

	checkConstraint: '${name}CHECK (${expression})',
};
