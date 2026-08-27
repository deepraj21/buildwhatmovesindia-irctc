const app = require("../index");
const { connectDatabase } = require("../config/database");

let databaseConnection;

module.exports = async (request, response) => {
	databaseConnection ||= connectDatabase();
	await databaseConnection;
	return app(request, response);
};
