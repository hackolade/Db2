const { isEmpty, isPlainObject, omit } = require('lodash');

/**
 * @param {{ encryption?: object }}
 * @returns {string}
 */
const getColumnEncrypt = ({ encryption }) => {
	if (!isPlainObject(encryption) || isEmpty(omit(encryption, 'id'))) {
		return '';
	}

	const { ENCRYPTION_ALGORITHM, INTEGRITY_ALGORITHM, noSalt } = encryption;
	const encryptionAlgorithmString = ENCRYPTION_ALGORITHM ? ` USING '${ENCRYPTION_ALGORITHM}'` : '';
	const integrityAlgorithmString = INTEGRITY_ALGORITHM ? ` '${INTEGRITY_ALGORITHM}'` : '';
	const noSaltString = noSalt ? ' NO SALT' : '';

	return ` ENCRYPT${encryptionAlgorithmString}${integrityAlgorithmString}${noSaltString}`;
};

module.exports = {
	getColumnEncrypt,
};
