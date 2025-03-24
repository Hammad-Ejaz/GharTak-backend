import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Service } from "../models/service.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Place Order (User)
const placeOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, location } = req.body;
  const userId = req.user._id;

  // Validate input (remove location from required fields)
  if (!items?.length || !paymentMethod) {
    throw new apiError(400, "Missing required fields");
  }

  const user = await User.findById(userId);
  if (!user) throw new apiError(404, "User not found");

  // Get location from request or user profile
  let orderLocation = location;
  if (!orderLocation?.coordinates) {
    if (!user.location?.coordinates) {
      throw new apiError(400, "Location is required - provide in request or user profile");
    }
    orderLocation = user.location;
  }

  let totalAmount = 0;
  const processedItems = [];

  // Process items
  for (const item of items) {
    const { itemType, itemId, quantity } = item;

    // Validate item
    if (!itemType || !itemId || !quantity) {
      throw new apiError(400, "Invalid item structure");
    }

    const Model = itemType === "Product" ? Product : Service;
    const dbItem = await Model.findById(itemId);
    if (!dbItem) throw new apiError(404, `${itemType} not found`);

    // Check stock for products
    if (itemType === "Product" && dbItem.stock < quantity) {
      throw new apiError(400, `Insufficient stock for ${dbItem.name}`);
    }

    totalAmount += dbItem.price * quantity;
    processedItems.push({
      itemType,
      itemId: dbItem._id,
      quantity,
      price: dbItem.price
    });
  }

  // Handle payment
  let paymentStatus = "pending";
  let paymentScreenshot;

  if (paymentMethod === "credits") {
    if (user.creditBalance < totalAmount) {
      throw new apiError(400, "Insufficient credits");
    }
    user.creditBalance -= totalAmount;
    await user.save();
    paymentStatus = "verified";
  } else if (paymentMethod === "transfer") {
    if (!req.file) throw new apiError(400, "Payment screenshot required");
    const result = await uploadOnCloudinary(req.file.path);
    if (!result?.url) throw new apiError(500, "Failed to upload screenshot");
    paymentScreenshot = result.url;
  }

  // Update stock for products
  for (const item of processedItems.filter(i => i.itemType === "Product")) {
    const product = await Product.findById(item.itemId);
    product.stock -= item.quantity;
    await product.save();
  }

  // Create order
  const order = await Order.create({
    user: userId,
    items: processedItems,
    totalAmount,
    paymentMethod,
    paymentScreenshot,
    paymentStatus,
    status: "pending",
    location: {
      type: "Point",
      coordinates: orderLocation.coordinates
    }
  });

  return res
    .status(201)
    .json(new apiResponse(201, order, "Order placed successfully"));
});

// Get User Orders (User)
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort("-createdAt")
    .populate("items.itemId", "name price");

  return res
    .status(200)
    .json(new apiResponse(200, orders, "Orders retrieved successfully"));
});

// Update Order Status (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can update order status");
  }

  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["confirmed", "rejected"];
  if (!validStatuses.includes(status)) {
    throw new apiError(400, "Invalid status");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new apiError(404, "Order not found");

  // Handle refunds for rejected credit orders
  if (status === "rejected" && order.paymentMethod === "credits") {
    const user = await User.findById(order.user);
    user.creditBalance += order.totalAmount;
    await user.save();
  }

  order.status = status;
  await order.save();

  return res
    .status(200)
    .json(new apiResponse(200, order, "Order status updated"));
});

// Get All Orders (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can view all orders");
  }

  const { status, paymentStatus } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const orders = await Order.find(filter)
    .sort("-createdAt")
    .populate("user", "name email")
    .populate("items.itemId", "name price");

  return res
    .status(200)
    .json(new apiResponse(200, orders, "Orders retrieved successfully"));
});

// Verify Payment (Admin)
const verifyPayment = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can verify payments");
  }

  const { orderId } = req.params;
  const { status } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    throw new apiError(400, "Invalid payment status");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new apiError(404, "Order not found");

  order.paymentStatus = status;
  await order.save();

  return res
    .status(200)
    .json(new apiResponse(200, order, "Payment status updated"));
});

// Get Nearby Orders (Admin)
const getNearbyOrders = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can view nearby orders");
  }

  const { longitude, latitude, maxDistance = 5000 } = req.query;

  const orders = await Order.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseFloat(maxDistance)
      }
    }
  }).populate("user", "name email");

  return res
    .status(200)
    .json(new apiResponse(200, orders, "Nearby orders retrieved"));
});

export {
  placeOrder,
  getUserOrders,
  updateOrderStatus,
  getAllOrders,
  verifyPayment,
  getNearbyOrders
};
