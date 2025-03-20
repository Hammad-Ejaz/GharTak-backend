import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ["Product", "Service"],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "items.itemType",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credits", "transfer"],
      required: true,
    },
    paymentScreenshot: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ location: "2dsphere" });

export const Order = mongoose.model("Order", orderSchema);