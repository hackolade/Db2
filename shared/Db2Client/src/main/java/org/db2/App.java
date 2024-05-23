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
				JSONArray queryResult = db2Service.executeQuery(query);
				result.put("data", queryResult);
			}
		} catch (SQLException e) {
			JSONObject errorObj = new JSONObject();
			errorObj.put("message", e.getMessage());
			errorObj.put("stack", e.getStackTrace());

			result.put("error", errorObj);
		} finally {
			db2Service.closeConnection();
			print(result.toString());
		}
	}

	private static String cleanStringValue(String value) {
		return value.replace("<\\$>", "\"");
	}

	private static String findArgument(String[] args, Argument argument) {
		return Arrays.stream(args)
				.filter(arg -> arg.startsWith(argument.getPrefix()))
				.map(arg -> arg.substring(argument.getStartValueIndex()))
				.findFirst()
				.orElse("");
	}

	private static void print(String value) {
		System.out.println(String.format("<hackolade>%s</hackolade>", value));
	}
}
