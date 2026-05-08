import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(uri).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const TestResult = mongoose.model('TestResult', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({});
  const tests = await TestResult.find({});
  console.log('Users:', users.map(u => ({ email: u.email, name: u.name, role: u.role })));
  console.log('Tests count:', tests.length);
  process.exit(0);
});
