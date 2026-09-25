require('dotenv').config(); 

const app=require('./src/app');

const ConnectToDB = require('./src/db/db');
// const mongoose =require('./src/db/db')
const initSocketServer =require('./src/socket/socket.server')
const httpserver = require('http').createServer(app);


ConnectToDB()
initSocketServer(httpserver)
httpserver.listen(3000, () => {
  console.log("Server is running on Port 3000" );
});