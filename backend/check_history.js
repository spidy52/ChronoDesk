require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/chrono';
    await mongoose.connect(databaseUrl);
    
    const events = await mongoose.connection.db.collection('boardevents')
      .find({ 'data.id': 'b6088023-24c8-4e91-b1c4-e705879b58ac' })
      .sort({ timestamp: 1 })
      .toArray();
      
    console.log(`History of b6088023-24c8-4e91-b1c4-e705879b58ac (${events.length} events):`);
    events.forEach(e => {
      console.log(`- Type: ${e.type}, Time: ${e.timestamp}, x: ${e.data.x}, y: ${e.data.y}, scaleX: ${e.data.scaleX}, scaleY: ${e.data.scaleY}, points[0..2]: ${e.data.points?.slice(0, 4)}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
