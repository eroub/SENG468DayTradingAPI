// This file contains the methods for the commands that are neither buys or sells

exports.add = (userid, amount) => {
    // Purpose: Add the given amount of money to the users' account
};

exports.quote = (userid, stock) => {
    // Purpose: Get the current quote for the stock for the specified user
}

exports.dumplog = (filename) => {
    // Purpose: Print out to the specified file the complete set of transactions that have occurred in the system.
}

// NOT NEEDED FOR FIRST DELIVERABLE
exports.dumplogUserSpecific = (userid, filename) => {
    // Purpose: Print out the history of the users transactions to the user specified file
}