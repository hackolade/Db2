module.exports = {
	createSchema: 'CREATE SCHEMA ${schemaName}${authorization}${dataCapture};',

	createTable: 'CREATE${tableType} TABLE${ifNotExists} ${name}${tableProps}${tableOptions};',

	createAuxiliaryTable: 'CREATE${tableType} TABLE ${name}${tableOptions};',

	comment: '\nCOMMENT ON ${objectType} ${objectName} IS ${comment};\n',

	createTableProps: '${columns}${keyConstraints}${checkConstraints}${foreignKeyConstraints}',

	columnDefinition: '${name}${type}${default}${constraints}',

	createForeignKey:
		'ALTER TABLE ${foreignTable} ADD CONSTRAINT ${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete};',

	dropForeignKey: 'ALTER TABLE {$tableName} DROP FOREIGN KEY ${constraintName};',

	createForeignKeyConstraint:
		'${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete}',

	checkConstraint: '${name}CHECK (${expression})',

	createKeyConstraint: '${constraintName}${keyType}${columns}${options}',

	createView: 'CREATE${orReplace} VIEW ${name} ${viewProperties}\n\tAS ${selectStatement};',

	viewSelectStatement: 'SELECT ${keys}\n\tFROM ${tableName}',

	createIndex: 'CREATE${indexType} INDEX${indexName} ON ${indexTableName}${indexOptions};\n',

	alterPkConstraint: 'ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} PRIMARY KEY${columns}${options};',

	dropPK: 'ALTER TABLE ${tableName} DROP PRIMARY KEY;',

	alterNotNull: 'ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;',

	dropNotNull: 'ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL;',
};
