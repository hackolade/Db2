const { isEmpty, isPlainObject, omit } = require('lodash');

/**
 * @param {{ encryption }}
 * @returns {string}
 */
const getColumnEncrypt = ({ encryption }) => {
	if (isPlainObject(encryption) && !isEmpty(omit(encryption, 'id'))) {
		const { ENCRYPTION_ALGORITHM, INTEGRITY_ALGORITHM, noSalt } = encryption;
		return ` ENCRYPT${ENCRYPTION_ALGORITHM ? ` USING '${ENCRYPTION_ALGORITHM}'` : ''}${INTEGRITY_ALGORITHM ? ` '${INTEGRITY_ALGORITHM}'` : ''}${noSalt ? ' NO SALT' : ''}`;
	}
	return '';
};

module.exports = {
	getColumnEncrypt,
};
