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
    User.findAll({ where: { UserName: userObj.UserName } }).then((data) => {
        console.log(data);
        if(data.length == []) {
            // User does not exist yet create user
            User.create(userObj).then((status) => {
                if(status) {
                    return true;
                }
                return false;
            }).catch((err) => {
                console.log(err);
                return false;
            });
        } else {
            console.log("---\nUPDATE\n")
            console.log(data);
            console.log("---\n")
            User.update({ funds: userObj.amount + data[0].dataValues.Funds}, {where: {UserName: userObj.UserName }})
        }
    });

};

exports.quote = (userid, stock) => {
    // Purpose: Get the current quote for the stock for the specified user
    const stockSymbol = stock.split(0,3);
    let stockNumber = 0;
    stockSymbol.forEach((letter) => {
        const ascii = letter.charCodeAt(0);
        stockNumber += ascii;
    });

    //a stock symbols base price is the sum of its ascii values
    //add ten to get more interesting numbers at the lower range
    const basePrice = stockNumber + 10;

    const date = new Date();
    const time = date.getTime();
    const timeMod = time % 10;

    //pick a random number between 11 and 20
    const rand = Math.floor(Math.random() * (20 - 11 + 1)) + 11;

    let spikeMag = rand;
    //convert from two digit to one (ie. from 11 to 1.1)
    spikeMag /= Math.pow(10, 1);
    //spike magnitude is a random number between 1.1 and 2.0
    
    let stockPrice = basePrice;
    //decrease the base price by the spike magnitude if the time ends in 0-4
    if(timeMod < 5){
        stockPrice =  basePrice/spikeMag;
    //increase the base price by the spike magnitude if the time ends in 5-9
    } else {
        stockPrice = basePrice*spikeMag;
    }

    return stockPrice;
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
    }).catch(() => error = 1)

    if(!error) return true;
    return false;
}