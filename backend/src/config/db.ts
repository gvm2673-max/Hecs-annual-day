import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://giridha1043_db_user:fKlSyoi5LTc8CVhf@ac-7mjxnjl-shard-00-00.pw6tzia.mongodb.net:27017,ac-7mjxnjl-shard-00-01.pw6tzia.mongodb.net:27017,ac-7mjxnjl-shard-00-02.pw6tzia.mongodb.net:27017/dwrs?ssl=true&authSource=admin&retryWrites=true&w=majority';
const DEFAULT_DB = 'event';

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB;
    const opts = {
      dbName,
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000
    };

    cachedPromise = mongoose.connect(uri, opts).then((m) => {
      console.log(`Successfully connected to MongoDB database "${dbName}"`);
      return m;
    }).catch((err) => {
      cachedPromise = null;
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }

  try {
    await cachedPromise;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }

  return mongoose.connection;
}
