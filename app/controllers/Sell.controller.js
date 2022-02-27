// This controller contains all the methods that have to do with "selling" a stock
const db = require("../models/index");
const User = db.User;
const Transaction = db.Transaction;
const OwnedStocks = db.OwnedStocks;

const misc = require("./Misc.controller");

exports.sell = async (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Sell the specified dollar mount of the stock currently held by the specified user at the current price.
  // Condition: The user's account for the given stock must be greater than or equal to the amount being sold.

  const stockQuote = misc.quote(user, stock, dumpFile, transNum);
  const sellAmount = Math.floor(amount / stockQuote);
  if (amount < stockQuote) {
    const errMsg = "Stock Quote too high for desired amount";
    console.log("error: " + errMsg);
    var errorBlock = "<errorEvent>\n" + 
    `<timestamp>${new Date().valueOf()}</timestamp>\n` +
    `<server>local</server>\n` +
    `<transactionNum>${transNum}</transactionNum>\n` +
    `<command>SELL</command>\n` +
    `<username>${user}</username>\n` +
    `<stockSymbol>${stock}</stockSymbol>\n` +
    `<funds>${amount}</funds>\n` +
    `<errorMessage>${errMsg}</errorMessage>\n` +
    "</errorEvent>\n"
    dumpFile.write(errorBlock);
    return;
  }

  let newAmount;
  await OwnedStocks.findAll({
    where: { UserID: user, StockSymbol: stock },
  }).then(async (data) => {
    if (data.length == 0) {
      const errMsg = "Account " + user + " does not exist or does not own the stock";
      console.log("error: " + errMsg);
      var errorBlock = "<errorEvent>\n" + 
      `<timestamp>${new Date().valueOf()}</timestamp>\n` +
      `<server>local</server>\n` +
      `<transactionNum>${transNum}</transactionNum>\n` +
      `<command>SELL</command>\n` +
      `<username>${user}</username>\n` +
      `<stockSymbol>${stock}</stockSymbol>\n` +
      `<funds>${amount}</funds>\n` +
      `<errorMessage>${errMsg}</errorMessage>\n` +
      "</errorEvent>\n"
      dumpFile.write(errorBlock);
      return;
    }
    if (data[0].dataValues.StockAmount < sellAmount) {
      const errMsg = "Account " + user + " does not have enough stock to sell";
        console.log("error: " + errMsg);
        var errorBlock = "<errorEvent>\n" + 
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>BUY</command>\n` +
        `<username>${user}</username>\n` +
        `<stockSymbol>${stock}</stockSymbol>\n` +
        `<funds>${amount}</funds>\n` +
        `<errorMessage>${errMsg}</errorMessage>\n` +
        "</errorEvent>\n"
        dumpFile.write(errorBlock);
      return;
    }
    const oldAmount = parseInt(data[0].dataValues.StockAmount);
    newAmount = oldAmount - sellAmount;
  });

  const SellObject = {
    user: user,
    stock: stock,
    sellAmount: sellAmount,
    stockQuote: stockQuote,
    newAmount: newAmount,
  };
  return SellObject;
};

exports.commit_sell = async (user, sellObject, dumpFile, transNum) => {
  // Purpose:	Commits the most recently executed SELL command
  // Condition: The user must have executed a SELL command within the previous 60 seconds

  if (!sellObject?.stock || user !== sellObject.user) {
    const errMsg = "No sell to be committed";
    console.log("error: " + errMsg);
    var errorBlock = "<errorEvent>\n" + 
    `<timestamp>${new Date().valueOf()}</timestamp>\n` +
    `<server>local</server>\n` +
    `<transactionNum>${transNum}</transactionNum>\n` +
    `<command>COMMIT_SELL</command>\n` +
    `<username>${user}</username>\n` +
    `<errorMessage>${errMsg}</errorMessage>\n` +
    "</errorEvent>\n"
    dumpFile.write(errorBlock);
    return;
  }

  const { stock, sellAmount, stockQuote, newAmount } = sellObject;

  const TransactionObject = {
    UserID: user,
    TransactionType: "sell",
    StockSymbol: stock,
    StockAmount: sellAmount,
    StockQuote: stockQuote,
  };

  //add funds to the user
  const newFunds = stockQuote * sellAmount;
  await misc.add(user, newFunds);

  //create the transaction
  await Transaction.create(TransactionObject)
    .then((status) => {
      if (status) {
        const systemEventBlock = "<systemEvent>\n" +
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>Recording Transaction</command>\n` +
        `<username>${user}</username>\n` +
        `<stockSymbol>${stock}</stockSymbol>\n` +
        "</systemEvent>\n"
        dumpFile.write(systemEventBlock);
        return true;
      }
      return false;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });

  //update users portfolio
  await OwnedStocks.update(
    { StockAmount: newAmount },
    { where: { UserID: user, StockSymbol: stock } }
  ).then((status) => {
    if (status) {
      const systemEventBlock = "<systemEvent>\n" +
      `<timestamp>${new Date().valueOf()}</timestamp>\n` +
      `<server>local</server>\n` +
      `<transactionNum>${transNum}</transactionNum>\n` +
      `<command>Removing stock from user portfolio</command>\n` +
      `<username>${user}</username>\n` +
      `<stockSymbol>${stock}</stockSymbol>\n` +
      "</systemEvent>\n"
      dumpFile.write(systemEventBlock);
      return true;
    }
    return false;
  })
  .catch((err) => {
    console.log(err);
    return false;
  });;
};

exports.cancel_sell = (user, dumpFile, transNum) => {
  // Purpose: Cancels the most recently executed SELL Command
  // Condition: The user must have executed a SELL command within the previous 60 seconds
};

exports.set_sell_amount = (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Sets a defined amount of the specified stock to sell when the current stock price is equal or greater than the sell trigger point
  // Condition: The user must have the specified amount of stock in their account for that stock.
};

exports.set_sell_trigger = (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Sets the stock price trigger point for executing any SET_SELL triggers associated with the given stock and user
  // Condition: The user must have specified a SET_SELL_AMOUNT prior to setting a SET_SELL_TRIGGER
};

exports.cancel_set_sell = (user, stock, dumpFile, transNum) => {
  // Purpose: Cancels the SET_SELL associated with the given stock and user
  // Condition: The user must have had a previously set SET_SELL for the given stock
};
