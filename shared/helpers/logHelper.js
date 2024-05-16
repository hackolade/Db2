/**
 * @typedef {import('../types').AppLogger} AppLogger
 * @typedef {import('../types').Logger} Logger
 */

/**
 * @param {{ title: string; logger: AppLogger; hiddenKeys: string[] }}
 * @returns {Logger}
 */
const createLogger = ({ title, logger, hiddenKeys }) => {
	return {
		info(message) {
			logger.log('info', { message }, title, hiddenKeys);
		},

		progress(message, containerName = '', entityName = '') {
			logger.progress({ message, containerName, entityName });
		},

		error(error) {
			logger.log('error', error, title);
		},
	};
};

const logHelper = {
	createLogger,
};

module.exports = { logHelper };
