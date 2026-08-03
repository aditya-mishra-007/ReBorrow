const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Modern Mongoose doesn't need extra deprecation options anymore!
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Stop the program if the database fails to connect
  }
};

module.exports = connectDB;