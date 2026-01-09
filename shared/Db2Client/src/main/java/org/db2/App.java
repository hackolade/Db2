package org.db2;

import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.SQLException;
import java.util.Arrays;

public class App {
	public static void main(String[] args) {
		String host = findArgument(args, Argument.HOST);
		String port = findArgument(args, Argument.PORT);
		String database = findArgument(args, Argument.DATABASE);
		String user = findArgument(args, Argument.USER);
		String password = findArgument(args, Argument.PASSWORD);
		String query = cleanStringValue(findArgument(args, Argument.QUERY));
		String callable = findArgument(args, Argument.CALLABLE);
		String inParam = findArgument(args, Argument.IN_PARAM);

		Db2Service db2Service = new Db2Service(host, port, database, user, password, new ResponseMapper());

		JSONObject result = new JSONObject();

		try {
			db2Service.openConnection();

			boolean isCallableQuery = Boolean.parseBoolean(callable);

			if (isCallableQuery) {
				int queryResult = db2Service.executeCallableQuery(query, inParam);
				result.put("data", queryResult);
			} else {
				Object queryResult = db2Service.execute(query);
				result.put("data", queryResult);
			}
		} catch (SQLException e) {
			JSONObject errorObj = new JSONObject();
			errorObj.put("message", e.getMessage());
			errorObj.put("stack", e.getStackTrace());
			errorObj.put("query", query);

			result.put("error", errorObj);
		} finally {
			db2Service.closeConnection();
			print(result.toString());
		}
	}

	private static String cleanStringValue(String value) {
		value = value.replace("__PERCENT__", "%");

		// Check if the value is base64 encoded (query arguments are base64 encoded to preserve quotes)
		if (value.length() > 20 && value.matches("^[A-Za-z0-9+/=]+$")) {
			try {
				// preserve quotes and special characters
				byte[] decodedBytes = java.util.Base64.getDecoder().decode(value);
				value = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
			} catch (Exception _) {
				// use the original value for backward compatibility,
				// handles cases where the value isn't actually base64 encoded
			}
		}

		value = value.replace("\\\"", "\"");
		return value;
	}

	private static String findArgument(String[] args, Argument argument) {
		String value = Arrays.stream(args)
				.filter(arg -> arg.startsWith(argument.getPrefix()))
				.map(arg -> arg.substring(argument.getStartValueIndex()))
				.findFirst()
				.orElse("");

		if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
			value = value.substring(1, value.length() - 1);
		}

		return value;
	}

	private static void print(String value) {
		System.out.println(String.format("<hackolade>%s</hackolade>", value));
	}
}
