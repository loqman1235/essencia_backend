import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Brand from "../models/brandModel.js";
import Order from "../models/orderModel.js";

export const dashboardCounts = async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    const brandCount = await Brand.countDocuments();
    const orderCount = await Order.countDocuments();
    res.json({ productCount, userCount, orderCount, brandCount });
  } catch (error) {
    console.error("Failed to fetch dashboard counts:", error);
    res.status(500).json({ error: "Failed to fetch dashboard counts" });
  }
};
