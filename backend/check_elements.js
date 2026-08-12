require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/chrono';
    
    await mongoose.connect(databaseUrl);
    console.log('Connected to DB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Find board events or elements
    if (collections.some(c => c.name === 'boardevents')) {
      const events = await mongoose.connection.db.collection('boardevents').find({}).sort({ timestamp: -1 }).limit(10).toArray();
      console.log('LATEST 10 BOARD EVENTS:');
      console.log(JSON.stringify(events, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
