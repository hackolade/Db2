package org.db2;

import org.json.JSONArray;

import java.sql.*;

public class Db2Service {
	final String DB_URL;
	final String USER;
	final String PASSWORD;
	final String DATABASE;
	final ResponseMapper mapper;
	Connection connection = null;
	Statement statement = null;
	CallableStatement callableStatement = null;
	ResultSet response = null;

	public Db2Service(String host, String port, String database, String user, String password, ResponseMapper mapper) {
		this.USER = user;
		this.PASSWORD = password;
		this.DATABASE = database;
		this.mapper = mapper;
		this.DB_URL = this.getDbUrlFromArguments(host, port, database);
	}

	public JSONArray executeQuery(String query) throws SQLException {
		this.statement = connection.createStatement();
		this.response = statement.executeQuery(query);

		return mapper.convertToJson(response);
	}

	public int applyScript(String script) throws SQLException {
		String[] statements = splitStatements(script);
		int totalUpdateCount = 0;

		for (String statement : statements) {
			statement = statement.trim();

			if (statement.isEmpty()) {
				continue;
			}

			Statement statementInstance = connection.createStatement();

			try {
				statementInstance.execute(statement);
				totalUpdateCount += statementInstance.getUpdateCount();
			} catch (SQLException e) {
				int reorgPendingErrorCode = -668;

				if (e.getErrorCode() == reorgPendingErrorCode) {
					String tableName = extractTableNameFromError(e.getMessage());
					if (tableName != null) {
						reorganizeTable(tableName, statementInstance);

						// retry
						statementInstance.execute(statement);
						totalUpdateCount += statementInstance.getUpdateCount();
					} else {
						throw e;
					}
				} else {
					throw e;
				}
			} finally {
				statementInstance.close();
			}
		}

		return totalUpdateCount;
	}

	private String[] splitStatements(String query) {
		String[] parts = query.trim().split(";\\s+", -1);
		java.util.ArrayList<String> statements = new java.util.ArrayList<>();
		for (String part : parts) {
			part = part.trim();
			if (!part.isEmpty()) {
				statements.add(part);
			}
		}
		return statements.toArray(new String[0]);
	}

	private void reorganizeTable(String tableName, Statement stmt) throws SQLException {
		// Use ADMIN_CMD to execute REORG TABLE command
		// Escape single quotes in table name for the command string
		String escapedTableName = tableName.replace("'", "''");
		String reorgSql = "CALL SYSPROC.ADMIN_CMD('REORG TABLE " + escapedTableName + "')";
		stmt.execute(reorgSql);
		if (!connection.getAutoCommit()) {
			connection.commit();
		}
	}


	private String extractTableNameFromError(String errorMessage) {
		// Extract table name from error message like: SQLERRMC=7;db1.table2
		java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("SQLERRMC=\\d+;([^,;\\s]+)");
		java.util.regex.Matcher matcher = pattern.matcher(errorMessage);
		if (matcher.find()) {
			String tableName = matcher.group(1).trim();
			// Quote the table name properly for REORG statement
			// If it contains a dot, split into schema.table and quote both parts
			if (tableName.contains(".")) {
				String[] parts = tableName.split("\\.", 2);
				if (parts.length == 2) {
					return "\"" + parts[0] + "\".\"" + parts[1] + "\"";
				}
			}
			return "\"" + tableName + "\"";
		}
		return null;
	}

	public int executeCallableQuery(String query, String inParam) throws SQLException {
		this.callableStatement = connection.prepareCall(query);

		if (!inParam.isEmpty()) {
			int param = Integer.parseInt(inParam);

			this.callableStatement.setInt(1, param);
			this.callableStatement.execute();

			return param;
		}

		this.callableStatement.registerOutParameter(1, Types.INTEGER);
		this.callableStatement.execute();

		return this.callableStatement.getInt(1);
	}

	public void openConnection() throws SQLException {
		this.connection = DriverManager.getConnection(this.DB_URL, this.USER, this.PASSWORD);
	}

	public void closeConnection() {
		if (this.response != null) {
			try {
				this.response.close();
			} catch (SQLException _) {
				/* Ignored */
			}
		}
		if (this.statement != null) {
			try {
				this.statement.close();
			} catch (SQLException _) {
				/* Ignored */
			}
		}
		if (this.callableStatement != null) {
			try {
				this.callableStatement.close();
			} catch (SQLException _) {
				/* Ignored */
			}
		}
		if (this.connection != null) {
			try {
				this.connection.close();
			} catch (SQLException _) {
				/* Ignored */
			}
		}
	}

	private String getDbUrlFromArguments(String host, String port, String database) {
		return String.format("jdbc:db2://%s:%s/%s", host, port, database);
	}
}
