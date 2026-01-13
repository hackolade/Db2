package org.db2;

import org.json.JSONObject;

import java.util.Scanner;

public class App {
	public static void main(String[] args) {
		JSONObject result = new JSONObject();
		String query = "";
		Db2Service db2Service = null;

		try {
			String jsonInput = readStdin();
			JSONObject input = new JSONObject(jsonInput);

			String host = input.optString("host", "");
			String port = input.optString("port", "");
			String database = input.optString("database", "");
			String user = input.optString("user", "");
			String password = input.optString("password", "");
			query = input.optString("query", "");
			boolean callable = input.optBoolean("callable", false);
			String inParam = input.optString("inParam", "");
			boolean ddl = input.optBoolean("ddl", false);

			db2Service = new Db2Service(host, port, database, user, password, new ResponseMapper());
			db2Service.openConnection();

			if (callable) {
				int queryResult = db2Service.executeCallableQuery(query, inParam);
				result.put("data", queryResult);
			} else if (ddl) {
				int queryResult = db2Service.applyScript(query);
				result.put("data", queryResult);
			} else {
				org.json.JSONArray queryResult = db2Service.executeQuery(query);
				result.put("data", queryResult);
			}
		} catch (Exception e) {
			JSONObject errorObj = new JSONObject();
			errorObj.put("message", e.getMessage());
			errorObj.put("stack", e.getStackTrace());
			errorObj.put("query", query);
			result.put("error", errorObj);
		} finally {
			if (db2Service != null) {
				db2Service.closeConnection();
			}
			print(result.toString());
		}
	}

	private static String readStdin() throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String result = reader.lines().collect(Collectors.joining("\n"));
            return result.isEmpty() ? "{}" : result;
        }
    }

	private static void print(String value) {
		System.out.println(String.format("<hackolade>%s</hackolade>", value));
	}
}
