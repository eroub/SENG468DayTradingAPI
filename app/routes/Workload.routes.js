const multer = require('multer');
const router = require("express").Router();

module.exports = app => {
    const workload = require("../controllers/Workload.controller");
    const misc = require("../controllers/Misc.controller");

    // Execute uploaded workload (this route returns the logfile)
    router.get("/execute", workload.executeWorkload);

    // Download the dumpfile
    router.get("/download", workload.downloadDumpfile);

    // Helper route for destroying all values in table
    router.get("/destroy", misc.destroyAll);

    // Middleware upload destination for workload file
    const storage = multer.diskStorage({
        destination: "./InputOutput",
        filename: (req,file,cb) => cb(null, "workloadfile.txt")
    });
    const uploadDest = multer({ storage: storage});
    // Upload workload
    router.post("/", uploadDest.single('workload'), workload.readWorkload);

    app.use('/api/workload', router);
}; 