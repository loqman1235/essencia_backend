import express from "express";
import Order from "../models/orderModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Fetch income data for a specific time period, such as the current month
    const currentMonth = new Date().getMonth() + 1; // Adding 1 to get the current month (January is represented as 0)
    const incomeData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), currentMonth - 1, 1),
          }, // Start of the current month
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalIncome: { $sum: "$total" },
        },
      },
      {
        $sort: {
          _id: 1, // Sort by ascending time period (optional)
        },
      },
      {
        $project: {
          period: "$_id",
          totalIncome: 1,
          _id: 0,
        },
      },
    ]);

    res.json(incomeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
