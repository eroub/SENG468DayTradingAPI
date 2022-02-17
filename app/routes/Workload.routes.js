const multer = require('multer');
const router = require("express").Router();

module.exports = app => {
    const workload = require("../controllers/Workload.controller");

    // Execute uploaded workload and retrieve dumpfile
    router.get("/execute", workload.executeWorkload)

    // Upload destination for workload file
    const uploadDest = multer({ dest: './app/WorkloadFile'});
    // Upload workload
    router.post("/", uploadDest.single('workload'), workload.readWorkload);
    // ----------------------------------------------

    app.use('/api/workload', router);
}; 