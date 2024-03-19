const ReservedWords = Object.freeze({
    ALL: 'ALL',
    ANALYSE: 'ANALYSE',
    ANALYZE: 'ANALYZE',
    AND: 'AND',
    ANY: 'ANY',
    ARRAY: 'ARRAY',
    ASC: 'ASC',
    ASYMMETRIC: 'ASYMMETRIC',
    AUTHORIZATION: 'AUTHORIZATION',
    BINARY: 'BINARY',
    BOTH: 'BOTH',
    CASE: 'CASE',
    CAST: 'CAST',
    CHECK: 'CHECK',
    COLLATE: 'COLLATE',
    COLUMN: 'COLUMN',
    CONCURRENTLY: 'CONCURRENTLY',
    CONSTRAINT: 'CONSTRAINT',
    CREATE: 'CREATE',
    CROSS: 'CROSS',
    CURRENT_CATALOG: 'CURRENT_CATALOG',
    CURRENT_DATE: 'CURRENT_DATE',
    CURRENT_ROLE: 'CURRENT_ROLE',
    CURRENT_SCHEMA: 'CURRENT_SCHEMA',
    CURRENT_TIME: 'CURRENT_TIME',
    CURRENT_TIMESTAMP: 'CURRENT_TIMESTAMP',
    CURRENT_USER: 'CURRENT_USER',
    DEFAULT: 'DEFAULT',
    DEFERRABLE: 'DEFERRABLE',
    DESC: 'DESC',
    DISTINCT: 'DISTINCT',
    DO: 'DO',
    ELSE: 'ELSE',
    END: 'END',
    ENFORCED: 'ENFORCED',
    EXCEPT: 'EXCEPT',
    FALSE: 'FALSE',
    FOR: 'FOR',
    FOREIGN: 'FOREIGN',
    FREEZE: 'FREEZE',
    FROM: 'FROM',
    FULL: 'FULL',
    GRANT: 'GRANT',
    GROUP: 'GROUP',
    HAVING: 'HAVING',
    ILIKE: 'ILIKE',
    IN: 'IN',
    INITIALLY: 'INITIALLY',
    INTERSECT: 'INTERSECT',
    INTO: 'INTO',
    IS: 'IS',
    ISNULL: 'ISNULL',
    JOIN: 'JOIN',
    LATERAL: 'LATERAL',
    LEADING: 'LEADING',
    LEFT: 'LEFT',
    LIKE: 'LIKE',
    LIMIT: 'LIMIT',
    LOCALTIME: 'LOCALTIME',
    LOCALTIMESTAMP: 'LOCALTIMESTAMP',
    NATURAL: 'NATURAL',
    NOT: 'NOT',
    NOT_ENFORCED: 'NOT ENFORCED',
    NOT_TRUSTED: 'NOT TRUSTED',
    NULL: 'NULL',
    OFFSET: 'OFFSET',
    ON: 'ON',
    ONLY: 'ONLY',
    OR: 'OR',
    ORDER: 'ORDER',
    OUTER: 'OUTER',
    OVERLAPS: 'OVERLAPS',
    PLACING: 'PLACING',
    PRIMARY: 'PRIMARY',
    REFERENCES: 'REFERENCES',
    RETURNING: 'RETURNING',
    RIGHT: 'RIGHT',
    SELECT: 'SELECT',
    SESSION_USER: 'SESSION_USER',
    SIMILAR: 'SIMILAR',
    SOME: 'SOME',
    SYMMETRIC: 'SYMMETRIC',
    TABLE: 'TABLE',
    TABLESAMPLE: 'TABLESAMPLE',
    THEN: 'THEN',
    TO: 'TO',
    TRAILING: 'TRAILING',
    TRUE: 'TRUE',
    TRUSTED: 'TRUSTED',
    UNION: 'UNION',
    UNIQUE: 'UNIQUE',
    USER: 'USER',
    USING: 'USING',
    VARIADIC: 'VARIADIC',
    VERBOSE: 'VERBOSE',
    WHEN: 'WHEN',
    WHERE: 'WHERE',
    WINDOW: 'WINDOW',
    WITH: 'WITH',
});

const ReservedWordsAsArray = Object.values(ReservedWords);

module.exports = {
    ReservedWordsAsArray
}
