// This file contains the methods for the commands that are neither buys or sells
const db = require("../models/index");
const buy = require("./Buy.controller");
const sell  = require("./Sell.controller");
const User = db.User;
const Transaction = db.Transaction;
const OwnedStocks = db.OwnedStocks;
const Trigger = db.Trigger;

exports.add = async (userid, amount, dumpFile, transNum) => {
  // Purpose: Add the given amount of money to the users' account
  const userObj = {
    UserName: userid,
    Funds: amount,
  };

  // Check if user exists
  await User.findAll({ where: { UserName: userObj.UserName }}).then(async (data) => {
    if (data.length == 0) {
      // User does not exist yet create user
      await User.create(userObj)
        .then((status) => {
          if (status) {
            const accountTransactionBlock = "<accountTransaction>\n" +
            `<timestamp>${new Date().valueOf()}</timestamp>\n` +
            `<server>local</server>\n` +
            `<transactionNum>${transNum}</transactionNum>\n` +
            `<action>ADD</action>\n` +
            `<username>${userid}</username>\n` +
            `<funds>${amount}</funds>\n` +
            "</accountTransaction>\n";
            dumpFile.write(accountTransactionBlock);
            return true;
          }
          return false;
        })
        .catch((err) => {
          console.log(err);
          return false;
        });
    } else {
      const newFunds =
        parseInt(userObj.Funds) + parseInt(data[0].dataValues.Funds);
      //for cases of adding negative funds
      if(newFunds < 0){
        console.log("insufficient funds");
      }
      await User.update(
        { Funds: newFunds },
        { where: { UserName: userObj.UserName }}
      ).then((status) => {
        if (status) {
          if(amount > 0) {
            const accountTransactionBlock = "<accountTransaction>\n" +
            `<timestamp>${new Date().valueOf()}</timestamp>\n` +
            `<server>local</server>\n` +
            `<transactionNum>${transNum}</transactionNum>\n` +
            `<action>ADD</action>\n` +
            `<username>${userid}</username>\n` +
            `<funds>${amount}</funds>\n` +
            "</accountTransaction>\n";
            dumpFile.write(accountTransactionBlock);
          } else {
            const accountTransactionBlock = "<accountTransaction>\n" +
            `<timestamp>${new Date().valueOf()}</timestamp>\n` +
            `<server>local</server>\n` +
            `<transactionNum>${transNum}</transactionNum>\n` +
            `<action>SELL</action>\n` +
            `<username>${userid}</username>\n` +
            `<funds>${amount}</funds>\n` +
            "</accountTransaction>\n";
            dumpFile.write(accountTransactionBlock);
          }
          
          return true;
        }
        return false;
      });
    }
  });
};

exports.getAllTransactions = (req, res) => {
  const userID = req.params.user;
  User.findAll({ where: { UserName: userID }, include: [Transaction] }).then(
    (data) => {
      return res.send(data);
    }
  );
};

exports.quote = (userid, stock, dumpFile, transNum) => {
  // Purpose: Get the current quote for the stock for the specified user
  const stockArray = Array.from(stock);
  const stockSymbol = stockArray.slice(0, 3);
  let stockNumber = 0;
  stockSymbol.forEach((letter) => {
    const ascii = letter.charCodeAt(0);
    stockNumber += ascii;
  });

  //a stock symbols base price is the sum of its ascii values
  //the lowest base (AAA) is 195, the highest base (ZZZ) is (270). Scale it to make it more appropriate.
  const basePrice = stockNumber / 3;

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
  if (timeMod < 5) {
    stockPrice = basePrice / spikeMag;
    //increase the base price by the spike magnitude if the time ends in 5-9
  } else {
    stockPrice = basePrice * spikeMag;
  }

  // Generate random string for crypto key
  // Function gathered from https://attacomsian.com/blog/javascript-generate-random-string
  const random = (length = 8) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };

  // Write to dumpfile a quoteServer block
  var quoteBlock = "<quoteServer>\n" + 
  `<timestamp>${new Date().valueOf()}</timestamp>\n` +
  `<server>local</server>\n` +
  `<transactionNum>${transNum}</transactionNum>\n` +
  `<quoteServerTime>${new Date().valueOf()}</quoteServerTime>\n` +
  `<username>${userid}</username>\n` +
  `<stockSymbol>${stock}</stockSymbol>\n` +
  `<price>${stockPrice}</price>\n` +
  `<cryptokey>${random(30)}</cryptokey>\n` +
  "</quoteServer>\n"
  dumpFile.write(quoteBlock);

  return stockPrice;
};

exports.checkTriggers = async (dumpFile, transNum) => {
  await Trigger.findAll().then(async (data) => {
    for(const trigger of data){
      const triggerPrice = parseInt(trigger.dataValues?.TriggerPrice);
      if(!triggerPrice){
        continue;
      }
      const user = trigger.dataValues.UserID;
      const stockSymbol = trigger.dataValues.StockSymbol;
      const stockQuote = this.quote(user, stockSymbol, dumpFile, transNum);
      const triggerType = trigger.dataValues.TriggerType;

      console.log("Trigger Price is: " + triggerPrice + " Stock Quote is: " + stockQuote);
      if(triggerType == "sell" && stockQuote < triggerPrice){
        continue;
      }
      if(triggerType == "buy" && stockQuote > triggerPrice){
        continue;
      }
      console.log("Triggering trigger!");
      const stockAmount = parseInt(trigger.dataValues.TriggerAmount);

      if(triggerType === "buy"){

        let newFunds;
        await User.findAll({where: {UserName: user}}).then((data) => {
          if(data.length == 0){
            console.log("error: user does not exist");
          }
          //newFunds are the same as the old funds because the User has already paid
          newFunds = parseInt(data[0].dataValues.Funds);
        });
        const BuyObject = {
          user: user,
          stock: stockSymbol,
          buyAmount: stockAmount,
          stockQuote: stockQuote,
          newFunds: newFunds,
        };
        await buy.commit_buy(user, BuyObject, dumpFile);
  
        await Trigger.destroy({ where: { UserID: user, StockSymbol: stockSymbol , TriggerType: "buy"} });
      //sell
      } else {

        let newAmount;
        await OwnedStocks.findAll({where: {UserID: user, StockSymbol: stockSymbol}}).then((data) => {
          if(data.length == 0){
            //this shouldn't happen
            console.log("error: user does not have any of this stock");
            return;
          }
          newAmount = parseInt(data[0].dataValues.StockAmount) - stockAmount;
          if(newAmount < 0){
            console.log("error: not enough stock left to complete this trigger, deleting trigger");
            await Trigger.destroy({ where: { UserID: user, StockSymbol: stockSymbol, TriggerType: "sell"} });
            return;
          }
        });
        const SellObject = {
          user: user,
          stock: stockSymbol,
          sellAmount: stockAmount,
          stockQuote: stockQuote,
          newAmount: newAmount,
        };
        await sell.commit_sell(user, SellObject, dumpFile);

        await Trigger.destroy({ where: { UserID: user, StockSymbol: stockSymbol, TriggerType: "sell"} });
      }
    }
  });
}

exports.dumplog = (filename) => {
  // Purpose: Print out to the specified file the complete set of transactions that have occurred in the system.
};

exports.displaySummary = (userid, dumpFile, transNum) => {
  // Purpose: Provides a summary to the client of the given user's transaction history and the current status of their accounts as well as any set buy or sell triggers and their parameters
};

// NOT NEEDED FOR FIRST DELIVERABLE
exports.dumplogUserSpecific = (userid, filename, dumpFile, transNum) => {
  // Purpose: Print out the history of the users transactions to the user specified file
};

// This function deletes all entries across all models
// This is for creating a fresh slate after a workload has been executed
exports.destroyAll = () => {
  // errored is true if one of the tables fails to destroy everything
  var error = 0;

  User.destroy({
    where: {},
    truncate: true,
  }).catch(() => (error = 1));

  if (!error) return true;
  return false;
};
