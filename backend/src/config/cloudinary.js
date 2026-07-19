import { v2 as cloudinary } from 'cloudinary';
import config from './env.js';
import logger from '../utils/logger.js';

const configureCloudinary = () => {
  if (!config.cloudinary.cloudName) {
    logger.warn('Cloudinary not configured - file uploads will fail');
    return;
  }
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  logger.info('Cloudinary configured');
};

export { cloudinary, configureCloudinary };
