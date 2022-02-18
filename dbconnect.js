const { Client } = require('pg')

// local database connection information
// const client = new Client({
//     user: '',
//     database:'',
//     port: 5432,
//     host: 'localhost',
//     password:''
// })

const connectionString = "postgres://gqkjlwirwnpkan:ebdf89a3342bf14f971c83ef1245515cd08c8c5424e410ce06597eff573a6bc7@ec2-107-22-18-26.compute-1.amazonaws.com:5432/d85mp33233b1qd"


    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    client.connect();
