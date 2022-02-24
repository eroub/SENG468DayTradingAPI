// Owned Stocks model that maps to the columns in the database
module.exports = (sequelize, Sequelize) => {
    const OwnedStocks = sequelize.define("OwnedStocks", {
        TransactionID: {
            primaryKey: true,
            type: Sequelize.STRING,
        },
        UserID: {
            type: Sequelize.STRING,
            allowNull: false,
            foreignKey: true,
        },
        StockSymbol: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        StockAmount: {
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        },
        StockBuyPrice: {    
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        },
    }, {
        freezeTableName: true,
        timestamps: false,
    });
    return OwnedStocks;
};