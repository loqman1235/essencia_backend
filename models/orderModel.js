import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    email: { type: String },
    address: {
      name: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: { type: String },
        quantity: Number,
      },
    ],
    total: Number,
    orderID: { type: String },
    paymentMethod: { type: String },
    paymentStatus: String,
    deliveryStatus: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
