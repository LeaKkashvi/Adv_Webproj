import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import logger from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDB();
    configureCloudinary();

    app.listen(config.port, () => {
      logger.info(
        `Server running in ${config.nodeEnv} mode on port ${config.port}`,
      );
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
