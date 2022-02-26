const path = require('path');
const fs = require('fs');

// Imprort other controllers here
const buy = require("./Buy.controller");
const sell = require("./Sell.controller");
const misc = require("./Misc.controller");

exports.readWorkload = (req,res) => {
    // This route exists solely to force the user to wait until the Workload
    // file has uploaded, for large files this may take a while
    
    // Return 200 success
    res.status(200).send();
}

exports.downloadDumpfile = (req,res) => {
    // This route exists so that users can download the dumpfile
    // Execute workload must complete before this can be called

    // Res download file
    res.download(path.resolve(__dirname, "../../InputOutput/dumpfile.txt"));
}

// Async function for reading and writing to files
const readWrite = async () => {
    // Create Dumpfile
    const fd = fs.openSync("./InputOutput/dumpfile.txt", "w");

    // Try reading in the workfile
    try {
        // Create write stream for the dumpfile
        const dumpFile = fs.createWriteStream(path.resolve(__dirname, "../../InputOutput/dumpfile.txt"), { flags: 'a' });
        const data = fs.readFileSync(path.resolve(__dirname, "../../InputOutput/workloadfile.txt"), 'UTF-8');

        // Write <?xml> and <log> 
        // Always occurs before executing commands
        dumpFile.write('<?xml version="1.0"?>\n<log>\n')

        // Split contents by line
        const lines = data.split(/\r?\n/);

        // Create empty objects for stock buys and sells
        let buyObject = {};
        let sellObject = {};

        // Read line by line
        let index = 0;
        for(const line of lines){
            const argument = line.split(" ")[1].split(",");
            // First write to dumpfile what the userCommand is
            // Do not write if argument is DUMPLOG
            if(argument[0] != "DUMPLOG") {
                // Initial commandBlock
                var commandBlock = "<userCommand>\n" + 
                `<timestamp>${new Date().valueOf()}</timestamp>\n` +
                `<transactionNum>${index+1}</transactionNum>\n` +
                `<command>${argument[0]}</command>\n` +
                `<username>${argument[1]}</username>\n`

                // If the command is ADD add funds
                if(argument[0] == "ADD") {
                    commandBlock += `<funds>${argument[2]}</funds>\n`;
                } else {
                    // Otherwise if there is a third argument it is a stocksymbol
                    if(argument.length >= 3 && argument[2]) {
                        commandBlock += `<stockSymbol>${argument[2]}</stockSymbol>\n`
                    }
                    // Lastly if there is a fourth command it is a different funds
                    if(argument[3]) {
                        commandBlock += `<funds>${argument[3]}</funds>\n`
                    }
                }

                // Lastly append closing </userCommand>
                commandBlock += "</userCommand>\n"

                dumpFile.write(commandBlock)
            }
            // SWITCH operator for deciding which function to call based on command
            switch (argument[0]) {
                case "ADD":
                    await misc.add(argument[1], argument[2]);
                    break;
                case "QUOTE":
                    misc.quote(argument[1], argument[2]);
                    break;
                case "BUY":
                    buyObject = await buy.buy(argument[1], argument[2], argument[3]);
                    break;
                case "COMMIT_BUY":
                    await buy.commit_buy(argument[1], buyObject);
                    buyObject = {};
                    break;
                case "CANCEL_BUY":
                    //do we need this?
                    //buy.cancel_buy(argument[1]);
                    buyObject = {};
                    break;
                case "SELL":
                    sellObject = await sell.sell(argument[1], argument[2], argument[3]);
                    break;
                case "COMMIT_SELL":
                    await sell.commit_sell(argument[1], sellObject);
                    sellObject = {};
                    break;
                case "CANCEL_SELL":
                    //do we need this?
                    //sell.cancel_sell(argument[1]);
                    sellObject = {};
                    break;
                case "SET_BUY_AMOUNT":
                    buy.set_buy_amount(argument[1], argument[2], argument[3]);
                    break;
                case "CANCEL_SET_BUY":
                    buy.cancel_set_buy(argument[1], argument[2]);
                    break;
                case "SET_BUY_TRIGGER":
                    buy.set_buy_trigger(argument[1], argument[2], argument[3]);
                    break;
                case "SET_SELL_AMOUNT":
                    sell.set_sell_amount(argument[1], argument[2], argument[3]);
                    break;
                case "SET_SELL_TRIGGER":
                    sell.set_sell_trigger(argument[1], argument[2], argument[3]);
                    break;
                case "CANCEL_SET_SELL":
                    sell.cancel_set_sell(argument[1], argument[2]);
                    break;
                case "DISPLAY_SUMMARY":
                    misc.displaySummary(argument[1]);
                    break;
                case "DUMPLOG":
                    if(argument.length = 3) {
                        misc.dumplogUserSpecific(argument[1], argument[2]);
                    } else {
                        misc.dumplog(argument[1]);
                    }
                    break;
                default:
                    console.log("AN ERROR OCCURRED READING: " + argument);
            };
            index++;
        }

        // Write </log>
        // Always happens after execution of commands
        dumpFile.write("</log>")

        // End write stream
        dumpFile.end();

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }

    // Close file
    fs.close(fd, (err) => {
        if(err) console.log("File close errored", err);
    });
}

exports.executeWorkload = async (req,res) => {
    // Check that workload file exists
    // if it does not exist then calls were made out of order
    if(!fs.existsSync(path.resolve(__dirname, "../../InputOutput/workloadfile.txt"))) {
        res.status(500).send({
            message: "No workload file present, post a workload file to /api/workload"
        });
        return;
    }

    readWrite().then(() => {
        // Destroy all entries across all tables
        misc.destroyAll();
        // Return dumpfile to the user
        res.status(200).send({ message: "dumpfile was successfully created"});
    }).catch((err) => {
        console.log(err);
        res.status(500).send({ message: err });
    })
}