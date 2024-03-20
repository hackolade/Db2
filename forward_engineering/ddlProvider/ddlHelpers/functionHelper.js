module.exports = ({
	_,
	templates,
	assignTemplates,
	getFunctionArguments,
	getNamePrefixedWithSchemaName,
	wrapComment,
}) => {
	const getFunctionsScript = (schemaName, udfs) => {
		return _.map(udfs, udf => {
			const orReplace = udf.functionOrReplace ? ' OR REPLACE' : '';
			const createFunctionStatement = assignTemplates(templates.createFunction, {
				name: getNamePrefixedWithSchemaName(udf.name, schemaName),
				orReplace: orReplace,
				parameters: getFunctionArguments(udf.functionArguments),
				returnType: udf.functionReturnsSetOf ? `SETOF ${udf.functionReturnType}` : udf.functionReturnType,
				language: udf.functionLanguage,
				definition: udf.functionBody,
			});
			const commentOnFunction = udf.functionDescription
				? assignTemplates(templates.comment, {
						object: 'FUNCTION',
						objectName: getNamePrefixedWithSchemaName(udf.name, schemaName),
						comment: wrapComment(udf.functionDescription),
				  })
				: '';

			return [createFunctionStatement, commentOnFunction].filter(Boolean).join('\n');
		}).join('\n');
	};

	return {
		getFunctionsScript,
	};
};
