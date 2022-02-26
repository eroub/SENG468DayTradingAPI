const multer = require('multer');
const router = require("express").Router();

module.exports = app => {
    const misc = require("../controllers/Misc.controller");

    router.post("/:user", misc.getAllTransactions);
    //router.post("/:stockSymbol", misc.testQuote);

    app.use('/api/misc', router);
}; 