import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';


cloudinary.config({ 
  cloud_name: 'dubeurhmd',
  api_key: '445975618486348',
  api_secret: '80odJ7pGixbSX8fpZBKtKm9XEh0'
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