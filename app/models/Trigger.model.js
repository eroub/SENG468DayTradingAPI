// Owned Stocks model that maps to the columns in the database
module.exports = (sequelize, Sequelize) => {
    const Trigger = sequelize.define("Trigger", {
        UserID: {
            type: Sequelize.STRING,
            allowNull: false,
            foreignKey: true,
        },
        TriggerType: {
            type: Sequelize.ENUM,
            values: ['buy', 'sell'],
            allowNull: false,
        },
        StockSymbol: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        TriggerAmount: {
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        },
        TriggerPrice: {    
            type: Sequelize.DECIMAL(18,2),
        },
    }, {
        freezeTableName: true,
    });
    return Trigger;
};