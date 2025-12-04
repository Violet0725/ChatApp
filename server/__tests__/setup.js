// Test setup file
require('dotenv').config();
const mongoose = require('mongoose');

// Use in-memory database for tests or test database
const TEST_DB = process.env.MONGO_URL_TEST || process.env.MONGO_URL;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
});

afterAll(async () => {
  // Clean up test data
  if (process.env.NODE_ENV === 'test') {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
  await mongoose.connection.close();
});
