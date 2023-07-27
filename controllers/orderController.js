import stripe from "stripe";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export const createOrder = async (req, res) => {
  try {
    const { cart, email, address } = req.body;

    const newOrder = new Order({
      products: cart.map((product) => ({
        productId: product.productId,
        productName: product.name,
        quantity: product.quantity,
      })),
      email,
      address,
      status: "En attente",
    });

    await newOrder.save();

    const lineItems = await Promise.all(
      cart.map(async (product) => {
        const productData = await Product.findById(product.id);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: productData?.name,
            },
            unit_amount: productData?.price * 100,
          },
          quantity: product?.qty,
        };
      })
    );

    const session = await stripeInstance.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:5174/?success=true",
      cancel_url: "http://localhost:5174/?success=false",
      client_reference_id: newOrder._id.toString(), // Pass the order ID as a client reference ID
    });
  } catch (error) {
    console.error("Failed to create the order:", error);
    res.status(500).json({ error: "Failed to create the order" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    if (orders.length === 0) {
      return res.status(404).json({ message: "Commandes introuvables" });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;
    const order = await Order.findById({ _id: id });
    if (!order) {
      return res.status(404).json("Order not found");
    }
    order.deliveryStatus = deliveryStatus;
    await order.save();

    res.json("Delivery status updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};

export const removeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json("Order not found");
    }

    await Order.findByIdAndDelete(id);

    res.status(200).json("Commande supprimée avec succès.");
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};
