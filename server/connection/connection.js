const mongoose = require("mongoose");

let username = 'Maanas';
let password = 'Maanas123';

let uri = `mongodb+srv://${username}:${password}@cluster0.4le7hci.mongodb.net/?retryWrites=true&w=majority`;

const connectDB = mongoose
  .connect(uri)
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = connectDB;
