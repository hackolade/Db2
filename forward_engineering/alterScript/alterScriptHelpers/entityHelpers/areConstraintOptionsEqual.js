const _ = require('lodash');

const areConstraintOptionsEqual = (oldConstraintOptions = [], constraintOptions = []) => {
	return (
		oldConstraintOptions.length === constraintOptions.length &&
		_(oldConstraintOptions).differenceWith(constraintOptions, _.isEqual).isEmpty()
	);
};

module.exports = {
	areConstraintOptionsEqual,
};
