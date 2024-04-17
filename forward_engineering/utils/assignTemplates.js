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
			return templateData[templateName] || templateData[templateName] === 0 ? templateData[templateName] : '';
		});
	}, template);
};

module.exports = {
	assignTemplates,
};
