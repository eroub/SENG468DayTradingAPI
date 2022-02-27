// This controller contains all the methods that have to do with "buying" a stock
const db = require("../models/index");
const User = db.User;
const Transaction = db.Transaction;
const OwnedStocks = db.OwnedStocks;
const Trigger = db.Trigger;

const misc = require("./Misc.controller");

exports.buy = async (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Buy the dollar amount of the stock for the specified user at the current price.
  // Conditions: The user's account must be greater or equal to the amount of the purchase.

  const stockQuote = misc.quote(user, stock, dumpFile, transNum);
  const buyAmount = Math.floor(amount / stockQuote);
  if(amount < stockQuote){
    const errMsg = "Stock Quote too high for desired amount";
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

  let newFunds;
  await User.findAll({ where: { UserName: user } }).then(async (data) => {
    if (data.length == 0) {
      const errMsg = "Account " + user + " does not exist or does not own the stock";
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
    } else {
      const spendAmount = buyAmount * stockQuote;
      const currentFunds = parseInt(data[0].dataValues.Funds);
      newFunds = currentFunds - spendAmount;
      if (newFunds < 0) {
        const errMsg = "Account " + user + " has insufficient funds";
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
    }
  });

  const BuyObject = {
    user: user,
    stock: stock,
    buyAmount: buyAmount,
    stockQuote: stockQuote,
    newFunds: newFunds,
  };

  return BuyObject;
};

exports.commit_buy = async (user, buyObject, dumpFile, transNum) => {
  // Purpose: Commits the most recently executed BUY command
  // Conditions: The user must have executed a BUY command within the previous 60 seconds

  if (!buyObject?.stock || user !== buyObject.user) {
    const errMsg = "No buy to be committed";
    console.log("error: " + errMsg);
    var errorBlock = "<errorEvent>\n" + 
    `<timestamp>${new Date().valueOf()}</timestamp>\n` +
    `<server>local</server>\n` +
    `<transactionNum>${transNum}</transactionNum>\n` +
    `<command>COMMIT_BUY</command>\n` +
    `<username>${user}</username>\n` +
    `<errorMessage>${errMsg}</errorMessage>\n` +
    "</errorEvent>\n"
    dumpFile.write(errorBlock);
    return;
  }

  const { stock, buyAmount, stockQuote, newFunds } = buyObject;
  const TransactionObject = {
    UserID: user,
    TransactionType: "buy",
    StockSymbol: stock,
    StockAmount: buyAmount,
    StockQuote: stockQuote,
  };
  const StockObject = {
    UserID: user,
    StockSymbol: stock,
    StockAmount: buyAmount,
    StockAveragePrice: stockQuote,
  };

  //subtract funds from the user
  await User.update({ Funds: newFunds }, { where: { UserName: user } }).then((status) => {
    if (status) {
      const accountTransactionBlock = "<accountTransaction>\n" +
      `<timestamp>${new Date().valueOf()}</timestamp>\n` +
      `<server>local</server>\n` +
      `<transactionNum>${transNum}</transactionNum>\n` +
      `<action>Subtracting amount to buy stock</action>\n` +
      `<username>${user}</username>\n` +
      `<funds>${newFunds}</funds>\n` +
      "</accountTransaction>\n";
      dumpFile.write(accountTransactionBlock);
      return true;
    }
    return false;
  });

  //create the transaction history
  await Transaction.create(TransactionObject)
    .then((status) => {
      if (status) {
        const systemEventBlock = "<systemEvent>\n" +
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>Recording Transaction</command>\n` +
        `<username>${user}</username>\n` +
        `<stockSymbol>${TransactionObject.StockSymbol}</stockSymbol>\n` +
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
  await OwnedStocks.findAll({
    where: { UserID: user, StockSymbol: stock },
  }).then(async (data) => {
    if (data.length == 0) {
      //User has none of this stock, so add it
      await OwnedStocks.create(StockObject)
        .then((status) => {
          if (status) {
            const systemEventBlock = "<systemEvent>\n" +
            `<timestamp>${new Date().valueOf()}</timestamp>\n` +
            `<server>local</server>\n` +
            `<transactionNum>${transNum}</transactionNum>\n` +
            `<command>Adding Stock to user portfolio</command>\n` +
            `<username>${user}</username>\n` +
            `<stockSymbol>${TransactionObject.StockSymbol}</stockSymbol>\n` +
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
    } else {
      const oldAmount = parseInt(data[0].dataValues.StockAmount);
      const oldBuyPrice = parseInt(data[0].dataValues.StockAveragePrice);
      const newAmount = oldAmount + buyAmount;
      const totalSpent = oldAmount * oldBuyPrice + buyAmount * stockQuote;
      const newPriceAverage = totalSpent / newAmount;
      await OwnedStocks.update(
        { StockAmount: newAmount, StockAveragePrice: newPriceAverage },
        { where: { UserID: user, StockSymbol: stock } }
      ).then((status) => {
        if (status) {
          const systemEventBlock = "<systemEvent>\n" +
          `<timestamp>${new Date().valueOf()}</timestamp>\n` +
          `<server>local</server>\n` +
          `<transactionNum>${transNum}</transactionNum>\n` +
          `<command>Adding Stock to user portfolio</command>\n` +
          `<username>${user}</username>\n` +
          `<stockSymbol>${TransactionObject.StockSymbol}</stockSymbol>\n` +
          "</systemEvent>\n"
          dumpFile.write(systemEventBlock);
          return true;
        }
        return false;
      });
    }
  });
};

exports.cancel_buy = async (user) => {
  // Purpose: Cancels the most recently executed BUY Command
  // Conditions: The user must have executed a BUY command within the previous 60 seconds
};

exports.set_buy_amount = async (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Sets a defined amount of the given stock to buy when the current stock price is less than or equal to the BUY_TRIGGER
  // Conditions: The user's cash account must be greater than or equal to the BUY amount at the time the transaction occurs

  const TriggerObject = {
    UserID: user,
    TriggerType: "buy",
    StockSymbol: stock,
    TriggerAmount: amount,
  };

  //reserve funds for user
  console.log(amount * -1);
  await misc.add(user, amount * -1);

  //create the trigger
  await Trigger.findAll({ where: { UserID: user, StockSymbol: stock } }).then(
    async (data) => {
      if (data.length !== 0) {
        const errMsg = "Trigger already exists for this stock";
        console.log("error: " + errMsg);
        var errorBlock = "<errorEvent>\n" + 
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>SET_BUY_AMOUNT</command>\n` +
        `<username>${user}</username>\n` +
        `<stockSymbol>${stock}</stockSymbol>\n` +
        `<funds>${amount}</funds>\n` +
        `<errorMessage>${errMsg}</errorMessage>\n` +
        "</errorEvent>\n"
        dumpFile.write(errorBlock);
        return;
      }
      await Trigger.create(TriggerObject)
        .then((status) => {
          if (status) {
            const systemEventBlock = "<systemEvent>\n" +
            `<timestamp>${new Date().valueOf()}</timestamp>\n` +
            `<server>local</server>\n` +
            `<transactionNum>${transNum}</transactionNum>\n` +
            `<command>Creating set buy amount for stock</command>\n` +
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
    }
  );
};

exports.cancel_set_buy = async (user, stock, dumpFile, transNum) => {
  // Purpose: Cancels a SET_BUY command issued for the given stock
  // Conditions: The must have been a SET_BUY Command issued for the given stock by the user

  let triggerValue;
  await Trigger.findAll({ where: { UserID: user, StockSymbol: stock } }).then(
    async (data) => {
      if (data.length == 0) {
        const errMsg = "No trigger set for this stock";
        console.log("error: " + errMsg);
        var errorBlock = "<errorEvent>\n" + 
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>CANCEL_SET_BUY</command>\n` +
        `<username>${user}</username>\n` +
        `<errorMessage>${errMsg}</errorMessage>\n` +
        "</errorEvent>\n"
        dumpFile.write(errorBlock);
        return;
      }
      triggerValue = parseInt(data[0].dataValues.TriggerAmount);
      await Trigger.destroy({ where: { UserID: user, StockSymbol: stock } })
      .then((status) => {
        if(status) {
          const systemEventBlock = "<systemEvent>\n" +
          `<timestamp>${new Date().valueOf()}</timestamp>\n` +
          `<server>local</server>\n` +
          `<transactionNum>${transNum}</transactionNum>\n` +
          `<command>Cancelling set buy for stock</command>\n` +
          `<username>${user}</username>\n` +
          `<stockSymbol>${stock}</stockSymbol>\n` +
          "</systemEvent>\n"
          dumpFile.write(systemEventBlock);
          return true;
        } else {
          return false;
        }
      });
    }
  );

  //add the funds back to the user
  if(triggerValue) misc.add(user, triggerValue);
};

exports.set_buy_trigger = async (user, stock, amount, dumpFile, transNum) => {
  // Purpose: Sets the trigger point base on the current stock price when any SET_BUY will execute.
  // Conditions: The user must have specified a SET_BUY_AMOUNT prior to setting a SET_BUY_TRIGGER

  await Trigger.findAll({ where: { UserID: user, StockSymbol: stock } }).then(
    async (data) => {
      if (data.length == 0) {
        const errMsg = user + " does not have buy amount set for this stock";
        console.log("error: " + errMsg);
        var errorBlock = "<errorEvent>\n" + 
        `<timestamp>${new Date().valueOf()}</timestamp>\n` +
        `<server>local</server>\n` +
        `<transactionNum>${transNum}</transactionNum>\n` +
        `<command>SET_BUY_TRIGGER</command>\n` +
        `<username>${user}</username>\n` +
        `<stockSymbol>${stock}</stockSymbol>\n` +
        `<funds>${amount}</funds>\n` +
        `<errorMessage>${errMsg}</errorMessage>\n` +
        "</errorEvent>\n"
        dumpFile.write(errorBlock);
        return;
      }
      if (data[0].dataValues.TriggerPrice) {
        const errMsg = user + " already has a buy point set for this stock";
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
      await Trigger.update(
        { TriggerPrice: amount },
        { where: { UserID: user, StockSymbol: stock } }
      ).then((status) => {
        if(status) {
          const systemEventBlock = "<systemEvent>\n" +
          `<timestamp>${new Date().valueOf()}</timestamp>\n` +
          `<server>local</server>\n` +
          `<transactionNum>${transNum}</transactionNum>\n` +
          `<command>Updating trigger</command>\n` +
          `<username>${user}</username>\n` +
          `<stockSymbol>${stock}</stockSymbol>\n` +
          "</systemEvent>\n"
          dumpFile.write(systemEventBlock);
          return true;
        } else {
          return false;
        }
      });
    }
  );
};
