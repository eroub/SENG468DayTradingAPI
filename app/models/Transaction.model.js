// Owned Stocks model that maps to the columns in the database
module.exports = (sequelize, Sequelize) => {
    const Transaction = sequelize.define("Transaction", {
        UserID: {
            type: Sequelize.STRING,
            allowNull: false,
            foreignKey: true,
        },
        TransactionType: {
            type: Sequelize.ENUM,
            values: ['buy', 'sell'],
            allowNull: false,
        },
        StockSymbol: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        StockAmount: {
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        },
        StockQuote: {    
            type: Sequelize.DECIMAL(18,2),
            allowNull: false,
        },
    }, {
        freezeTableName: true,
    });
    return Transaction;
};