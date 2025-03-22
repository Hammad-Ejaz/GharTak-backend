import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Service } from "../models/service.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create Service (Admin Only)
const createService = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can create services");
  }

  const { name, description, price, category } = req.body;

  // Handle image upload
  let imageUrl;
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse?.url) {
      throw new apiError(500, "Failed to upload image to Cloudinary");
    }
    imageUrl = cloudinaryResponse.url;
  }

  const service = await Service.create({
    name,
    description,
    price,
    category,
    image: imageUrl || null,
    createdBy: req.user._id
  });

  return res
    .status(201)
    .json(new apiResponse(201, service, "Service created successfully"));
});

// Update Service (Admin Only)
const updateService = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can update services");
  }

  const { serviceId } = req.params;
  const updateData = req.body;

  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse?.url) {
      throw new apiError(500, "Failed to upload image to Cloudinary");
    }
    updateData.image = cloudinaryResponse.url;
  }

  const updatedService = await Service.findByIdAndUpdate(
    serviceId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedService) {
    throw new apiError(404, "Service not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedService, "Service updated successfully"));
});

// Get All Services (Public)
const getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ available: true });
  return res
    .status(200)
    .json(new apiResponse(200, services, "Services retrieved successfully"));
});

// Get Service by ID (Public)
const getServiceById = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;

  const service = await Service.findById(serviceId);

  if (!service) {
    throw new apiError(404, "Service not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, service, "Service retrieved successfully"));
});

// Delete Service (Admin Only)
const deleteService = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can delete services");
  }

  const { serviceId } = req.params;

  const deletedService = await Service.findByIdAndDelete(serviceId);

  if (!deletedService) {
    throw new apiError(404, "Service not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Service deleted successfully"));
});

// Get Services by Category (Public)
const getServicesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const services = await Service.find({ 
    category: new RegExp(category, 'i'), 
    available: true 
  });

  return res
    .status(200)
    .json(new apiResponse(200, services, `Services in ${category} category retrieved`));
});

export {
  createService,
  updateService,
  getAllServices,
  getServiceById,
  deleteService,
  getServicesByCategory
};
