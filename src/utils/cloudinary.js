import 'dotenv/config'; // Add this at the very top
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Validate input
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      throw new Error('Invalid file path');
    }

    // Normalize Windows paths
    const normalizedPath = path.normalize(localFilePath);

    // Upload with error handling
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: 'auto',
      folder: 'gharTak'
    });

    // Cleanup temporary file
    fs.unlinkSync(normalizedPath);

    // Return secure URL
    if (!response.secure_url) {
      throw new Error('Cloudinary upload succeeded but no URL returned');
    }

    return {
      url: response.secure_url,
      public_id: response.public_id
    };

  } catch (error) {
    // Cleanup on error
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary Upload Error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export { uploadOnCloudinary };