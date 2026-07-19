import dns from 'dns';
import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

const configureDNS = () => {
  const currentServers = dns.getServers();
  if (currentServers.includes('127.0.0.1') && currentServers.length <= 1) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    logger.warn('Fixed DNS servers for SRV resolution (c-ares was using localhost)');
  }
};

const connectDB = async () => {
  try {
    configureDNS();
    const conn = await mongoose.connect(config.mongodb.uri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
