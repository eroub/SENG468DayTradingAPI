// This controller contains all the methods that have to do with "buying" a stock
const db = require("../models/index");
const User = db.User;
const Transaction = db.Transaction;
const OwnedStocks = db.OwnedStocks;

const misc = require("./Misc.controller");

exports.buy = async (user, stock, amount) => {
  // Purpose: Buy the dollar amount of the stock for the specified user at the current price.
  // Conditions: The user's account must be greater or equal to the amount of the purchase.

  const stockQuote = misc.quote(user, stock);
  const buyAmount = Math.floor(amount / stockQuote);
  if(amount < stockQuote){
    console.log("error: stock quote too high for desired amount");
    return;
  }

  let newFunds;
  await User.findAll({ where: { UserName: user } }).then(async (data) => {
    if (data.length == 0) {
      console.log("error: user does not exist");
      return;
    } else {
      const spendAmount = buyAmount * stockQuote;
      const currentFunds = parseInt(data[0].dataValues.Funds);
      newFunds = currentFunds - spendAmount;
      if (newFunds < 0) {
        console.log("error: insufficient funds");
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

exports.commit_buy = async (user, buyObject) => {
  // Purpose: Commits the most recently executed BUY command
  // Conditions: The user must have executed a BUY command within the previous 60 seconds

  if (!buyObject?.stock || user !== buyObject.user) {
    console.log("error: no buy ready to be committed");
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
  }

  //subtract funds from the user
  await User.update({ Funds: newFunds }, { where: { UserName: user } });

  //create the transaction history
  await Transaction.create(TransactionObject)
    .then((status) => {
      if (status) {
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
      );
    }
  });
};

exports.cancel_buy = (user) => {
  // Purpose: Cancels the most recently executed BUY Command
  // Conditions: The user must have executed a BUY command within the previous 60 seconds
};

exports.set_buy_amount = (user, stock, amount) => {
  // Purpose: Sets a defined amount of the given stock to buy when the current stock price is less than or equal to the BUY_TRIGGER
  // Conditions: The user's cash account must be greater than or equal to the BUY amount at the time the transaction occurs
};

exports.cancel_set_buy = (user, stock) => {
  // Purpose: Cancels a SET_BUY command issued for the given stock
  // Conditions: The must have been a SET_BUY Command issued for the given stock by the user
};

exports.set_buy_trigger = (user, stock, amount) => {
  // Purpose: Sets the trigger point base on the current stock price when any SET_BUY will execute.
  // Conditions: The user must have specified a SET_BUY_AMOUNT prior to setting a SET_BUY_TRIGGER
};
