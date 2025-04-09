//Import Mongoose

const mongoose = require('mongoose');
require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL;
// Connect to MongoDB

mongoose.connect(DATABASE_URL).then(() => {
    console.log('Connected to Database');
}).catch(error => {
    console.error('Error connecting to Database:' + error.message);
});
// Export Mongoose

module.exports = mongoose;