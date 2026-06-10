const mongoose = require('mongoose');

async function run() {
  try {
    const atlasUrl = 'mongodb+srv://itachi09061252_db_user:QoS36ZJyFAabzpc0@cluster0.8nyllrh.mongodb.net/chrono?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(atlasUrl);
    
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
