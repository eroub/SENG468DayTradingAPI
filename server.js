// Setup required packages
const express = require("express");
const cors = require("cors");

// Create app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect and Sync to DB
const db = require("./app/models");
db.sequelize.sync();

// ROUTES
require("./app/routes/Workload.routes")(app);

// Set port, listen for requests
const PORT = process.env.APIPORT || 8080;
app.listen(PORT, async () => {

    console.log(`Server is running on port ${PORT}.`);
});
