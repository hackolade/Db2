const _ = require('lodash');

const areConstraintOptionsEqual = (oldConstraintOptions, constraintOptions) => {
	return _(oldConstraintOptions).differenceWith(constraintOptions, _.isEqual).isEmpty();
};

module.exports = {
	areConstraintOptionsEqual,
};
