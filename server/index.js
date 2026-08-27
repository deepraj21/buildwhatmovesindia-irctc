const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { connectDatabase } = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1", api);
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message || "Unexpected server error." }));

const port = process.env.PORT || 3000;

if (require.main === module) {
  connectDatabase()
    .then(() => app.listen(port, () => console.log(`Rail API listening on http://localhost:${port}`)))
    .catch((error) => {
      console.error("Unable to start Rail API:", error.message);
      process.exit(1);
    });
}

module.exports = app;
