// User Access model that maps to the columns in the database
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {
        UserName: {
            primaryKey: true,
            type: Sequelize.STRING,
            alllowNull: false,
        },
        Funds: {
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        }
    }, {
        freezeTableName: true,
        timestamps: false,
    });
    return User;
};