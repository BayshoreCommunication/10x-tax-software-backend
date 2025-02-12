const mongoose = require('mongoose');
const { dataBaseUrl } = require('../secret');

// Database connect

mongoose
  .connect( dataBaseUrl)
  .then(() => {
    console.log('mongodb atlas is connected');
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
