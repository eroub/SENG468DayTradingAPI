const path = require('path');
const fs = require('fs');
const { Stream } = require('stream');

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

        // Split contents by line
        const lines = data.split(/\r?\n/);

        // Read line by line
        lines.forEach((line) => {
            dumpFile.write(line.split(" ")[1].split(",").toString() + "\n");
        })

        // End write stream
        dumpFile.end();

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: err });
    }

    // Close file
    fs.close(fd);
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
        // Return dumpfile to the user
        res.status(200).send({ message: "dumpfile was successfully created"});
    }).catch((err) => {
        console.log(err);
        res.status(500).send({ message: err });
    })
}