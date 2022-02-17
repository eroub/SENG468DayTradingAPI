const path = require('path');

exports.readWorkload = (req,res) => {
    // Return 200 success
    console.log(req.body);
    res.status(200).send();

}

exports.executeWorkload = (req,res) => {
    commands = {
        ADD: 0,
        QUOTE: 0,
        BUY: 0,
        COMMIT_BUY: 0,
        CANCEL_BUY: 0,
        SELL: 0,
        COMMIT_SELL: 0,
        CANCEL_SELL: 0,
        SET_BUY_AMOUNT: 0,
        CANCEL_SET_BUY: 0,
        SET_BUY_TRIGGER: 0,
        SET_SELL_AMOUNT: 0,
        SET_SELL_TRIGGER: 0,
        CANCEL_SET_SELL: 0,
        DUMPLOG: 0,
        DISPLAY_SUMMARY: 0
    }

    console.log(path.resolve(__dirname, "../../DumpFile/dump.txt"));

    res.sendFile(path.resolve(__dirname, "../../DumpFile/dump.txt"));
}