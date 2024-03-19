const {
    buildEntityLevelAlterScript,
    buildContainerLevelAlterScript,
    doesContainerLevelAlterScriptContainDropStatements,
    doesEntityLevelAlterScriptContainDropStatements
} = require("./alterScript/alterScriptBuilder");

module.exports = {
    generateScript(data, logger, callback, app) {
        try {
            const script = buildEntityLevelAlterScript(data, app);
            callback(null, script);
        } catch (error) {
            logger.log('error', {message: error.message, stack: error.stack}, 'PostgreSQL Forward-Engineering Error');

            callback({message: error.message, stack: error.stack});
        }
    },

    generateViewScript(data, logger, callback, app) {
        callback(new Error('Forward-Engineering of delta model on view level is not supported'));
    },

    generateContainerScript(data, logger, callback, app) {
        try {
            const script = buildContainerLevelAlterScript(data, app);
            callback(null, script);
        } catch (error) {
            logger.log('error', {message: error.message, stack: error.stack}, 'PostgreSQL Forward-Engineering Error');

            callback({message: error.message, stack: error.stack});
        }
    },

    getDatabases(connectionInfo, logger, callback, app) {
        logger.progress({message: 'Find all databases'});

        callback(new Error('Connecting to an instance is not supported'));
    },

    applyToInstance(connectionInfo, logger, callback, app) {
        logger.clear();
        logger.log(
            'info',
            app.require('lodash').omit(connectionInfo, 'script', 'containerData'),
            'connectionInfo',
            connectionInfo.hiddenKeys,
        );
        callback(new Error('Apply to instance is not supported'));
    },

    testConnection(connectionInfo, logger, callback, app) {
        callback(new Error('Connecting to an instance is not supported'));
    },

    isDropInStatements(data, logger, callback, app) {
        try {
            if (data.level === 'container') {
                const containsDropStatements = doesContainerLevelAlterScriptContainDropStatements(data, app);
                callback(null, containsDropStatements);
            } else {
                const containsDropStatements = doesEntityLevelAlterScriptContainDropStatements(data, app);
                callback(null, containsDropStatements);
            }
        } catch (e) {
            callback({message: e.message, stack: e.stack});
        }
    },
};
