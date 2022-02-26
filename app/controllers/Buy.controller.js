// This controller contains all the methods that have to do with "buying" a stock
const misc = require("./Misc.controller");

exports.buy = (user, stock, amount) => {
    // Purpose: Buy the dollar amount of the stock for the specified user at the current price.
    // Conditions: The user's account must be greater or equal to the amount of the purchase.
}

exports.commit_buy = (user) => {
    // Purpose: Commits the most recently executed BUY command
    // Conditions: The user must have executed a BUY command within the previous 60 seconds
}

exports.cancel_buy = (user) => {
    // Purpose: Cancels the most recently executed BUY Command
    // Conditions: The user must have executed a BUY command within the previous 60 seconds
}

exports.set_buy_amount = (user, stock, amount) => {
    // Purpose: Sets a defined amount of the given stock to buy when the current stock price is less than or equal to the BUY_TRIGGER
    // Conditions: The user's cash account must be greater than or equal to the BUY amount at the time the transaction occurs
}

exports.cancel_set_buy = (user, stock) => {
    // Purpose: Cancels a SET_BUY command issued for the given stock
    // Conditions: The must have been a SET_BUY Command issued for the given stock by the user
}

exports.set_buy_trigger = (user, stock, amount) => {
    // Purpose: Sets the trigger point base on the current stock price when any SET_BUY will execute.
    // Conditions: The user must have specified a SET_BUY_AMOUNT prior to setting a SET_BUY_TRIGGER
}