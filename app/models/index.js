const Sequelize = require("sequelize");
// Sequelize is object relational mapping (orm) library for connecting to the DB
const sequelize = new Sequelize("d85mp33233b1qd", "gqkjlwirwnpkan", "ebdf89a3342bf14f971c83ef1245515cd08c8c5424e410ce06597eff573a6bc7", {
    host: "ec2-107-22-18-26.compute-1.amazonaws.com",
    port : 5432,
    dialect: "postgres",
    ssl: true,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        requestTimeout: 600000,
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.User = require("./User.model.js")(sequelize, Sequelize);
db.OwnedStocks = require("./OwnedStocks.model.js")(sequelize, Sequelize);

//Users and OwnedStocks is a one to many relationship
db.User.hasMany(db.OwnedStocks, {
    foreignKey: "UserID",
    type: Sequelize.STRING,
    allowNull: false,
});
db.OwnedStocks.belongsTo(db.User);

module.exports = db;