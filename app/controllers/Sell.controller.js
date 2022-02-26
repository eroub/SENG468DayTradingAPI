// This controller contains all the methods that have to do with "selling" a stock
const misc = require("./Misc.controller");

exports.sell = (user, stock, amount) => {
    // Purpose: Sell the specified dollar mount of the stock currently held by the specified user at the current price.
    // Condition: The user's account for the given stock must be greater than or equal to the amount being sold.
}

exports.commit_sell = (user) => {
    // Purpose:	Commits the most recently executed SELL command
    // Condition: The user must have executed a SELL command within the previous 60 seconds
}

exports.cancel_sell = (user) => {
    // Purpose: Cancels the most recently executed SELL Command
    // Condition: The user must have executed a SELL command within the previous 60 seconds
}

exports.set_sell_amount = (user, stock, amount) => {
    // Purpose: Sets a defined amount of the specified stock to sell when the current stock price is equal or greater than the sell trigger point
    // Condition: The user must have the specified amount of stock in their account for that stock.
}

exports.set_sell_trigger = (user, stock, amount) => {
    // Purpose: Sets the stock price trigger point for executing any SET_SELL triggers associated with the given stock and user
    // Condition: The user must have specified a SET_SELL_AMOUNT prior to setting a SET_SELL_TRIGGER
}

exports.cancel_set_sell = (user, stock) => {
    // Purpose: Cancels the SET_SELL associated with the given stock and user
    // Condition: The user must have had a previously set SET_SELL for the given stock
}