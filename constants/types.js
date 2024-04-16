/**
 * @enum {string}
 */
const DATA_TYPE = {
	char: 'CHAR',
	varchar: 'VARCHAR',
	nchar: 'NCHAR',
	nvarchar: 'NVARCHAR',
	clob: 'CLOB',
	graphic: 'GRAPHIC',
	vargraphic: 'VARGRAPHIC',
	dbclob: 'DBCLOB',
	integer: 'INTEGER',
	smallint: 'SMALLINT',
	bigint: 'BIGINT',
	decimal: 'DECIMAL',
	float: 'FLOAT',
	real: 'REAL',
	double: 'DOUBLE',
	decfloat: 'DECFLOAT',
	date: 'DATE',
	time: 'TIME',
	timestamp: 'TIMESTAMP',
	binary: 'BINARY',
	varbinary: 'VARBINARY',
	blob: 'BLOB',
	boolean: 'BOOLEAN',
	json: 'JSON',
	array: 'ARRAY',
	multiset: 'MULTISET',
	xml: 'XML',
	rowid: 'ROWID',
};

const DATA_TYPES_WITH_BYTE = [DATA_TYPE.char, DATA_TYPE.varchar, DATA_TYPE.clob, DATA_TYPE.dbclob, DATA_TYPE.blob];

const DATA_TYPES_WITH_LENGTH = [
	DATA_TYPE.char,
	DATA_TYPE.varchar,
	DATA_TYPE.nchar,
	DATA_TYPE.nvarchar,
	DATA_TYPE.clob,
	DATA_TYPE.graphic,
	DATA_TYPE.vargraphic,
	DATA_TYPE.dbclob,
	DATA_TYPE.binary,
	DATA_TYPE.varbinary,
	DATA_TYPE.blob,
	DATA_TYPE.array,
];

const DATA_TYPES_WITH_PRECISION = [DATA_TYPE.decimal, DATA_TYPE.float, DATA_TYPE.decfloat];

const INTEGER_DATA_TYPES = [DATA_TYPE.integer, DATA_TYPE.smallint, DATA_TYPE.bigint];

module.exports = {
	DATA_TYPE,
	DATA_TYPES_WITH_BYTE,
	DATA_TYPES_WITH_LENGTH,
	DATA_TYPES_WITH_PRECISION,
	INTEGER_DATA_TYPES,
};
