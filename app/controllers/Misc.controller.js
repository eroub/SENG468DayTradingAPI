// This file contains the methods for the commands that are neither buys or sells
const db = require("../models/index");
const User = db.User;

exports.add = (userid, amount) => {
    // Purpose: Add the given amount of money to the users' account
    const userObj = {
        UserName: userid,
        Funds: amount
    }

    // Check if user exists
    // User.findAll({ where: { UserName: userObj.UserName } }).then((data) => {
    //     if(data = []) {
    //         // User does not exist yet create user
    //         User.create(userObj).then((status) => {
    //             if(status) {
    //                 return true;
    //             }
    //             return false;
    //         }).catch((err) => {
    //             console.log(err);
    //             return false;
    //         });
    //     } else {
    //         User.update({ funds: userObj.amount + data[0].dataValues.Funds}, {where: {UsrName: userObj.UserName }})
    //     }
    // })

};

exports.quote = (userid, stock) => {
    // Purpose: Get the current quote for the stock for the specified user
}

exports.dumplog = (filename) => {
    // Purpose: Print out to the specified file the complete set of transactions that have occurred in the system.
}

exports.displaySummary = (userid) => {
    // Purpose: Provides a summary to the client of the given user's transaction history and the current status of their accounts as well as any set buy or sell triggers and their parameters   
}

// NOT NEEDED FOR FIRST DELIVERABLE
exports.dumplogUserSpecific = (userid, filename) => {
    // Purpose: Print out the history of the users transactions to the user specified file
}


// This function deletes all entries across all models
// This is for creating a fresh slate after a workload has been executed
exports.destroyAll = () => {
    // errored is true if one of the tables fails to destroy everything
    var error = 0;

    User.destroy({
        where: {},
        truncate: true,
    }).catch(() => errored = 1)

    if(!error) return true;
    return false;
}