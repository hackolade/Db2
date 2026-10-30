const template = (modifiers = '') => new RegExp('\\$\\{(.*?)\\}', modifiers);
const getAllTemplates = str => str.match(template('gi')) || [];
const parseTemplate = str => (str.match(template('i')) || [])[1];

/**
 * @param {{ template: string, templateData: object}}
 * @returns {string}
 */
const assignTemplates = ({ template, templateData }) => {
	return getAllTemplates(template).reduce((result, item) => {
		const templateName = parseTemplate(item);

		return result.replace(item, () => {
			const value = templateData[templateName];
			if (value === undefined || value === null) {
				return '';
			}
			return value;
		});
	}, template);
};

module.exports = {
	assignTemplates,
};
