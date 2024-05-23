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
		if (response != null) {
			try {
				response.close();
			} catch (SQLException e) {
				/* Ignored */}
		}
		if (statement != null) {
			try {
				statement.close();
			} catch (SQLException e) {
				/* Ignored */}
		}
		if (callableStatement != null) {
			try {
				callableStatement.close();
			} catch (SQLException e) {
				/* Ignored */}
		}
		if (connection != null) {
			try {
				connection.close();
			} catch (SQLException e) {
				/* Ignored */}
		}
	}

	private String getDbUrlFromArguments(String host, String port, String database) {
		return String.format("jdbc:db2://%s:%s/%s", host, port, database);
	}
}
