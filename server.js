import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import stripe from "stripe";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";

dotenv.config();
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middlewares
app.use(
  express.json({
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    verify: function (req, res, buf) {
      var url = req.originalUrl;
      if (url.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://essencia-client-pzya.vercel.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Routes
    app.use("/api/v1/auth", authRoutes);

    // Admin Routes
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/orders", orderRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/products", productRoutes);
    app.use("/api/v1/brands", brandRoutes);
    app.use("/api/v1", dashboardRoutes);
    app.use("/api/v1/income", incomeRoutes);

    // Checkout
    app.post("/api/v1/create-checkout-session", async (req, res) => {
      const { cart, email, address, total } = req.body;
      try {
        const order = new Order({
          products: cart.map((product) => ({
            productId: product.productId,
            productName: product.name,
            quantity: product.quantity,
          })),
          paymentStatus: "En attente",
          deliveryStatus: "En attente",
          email,
          address: {
            name: "",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          },
          total,
          paymentMethod: "",
          orderID: "",
        });

        await order.save();

        const lineItems = await Promise.all(
          cart.map(async (product) => {
            const productData = await Product.findById(product._id);
            return {
              price_data: {
                currency: "usd",
                product_data: {
                  name: productData.name,
                  images: [productData.images[0]],
                },
                unit_amount: productData.price * 100,
              },
              quantity: product.qty,
            };
          })
        );

        const session = await stripeInstance.checkout.sessions.create({
          line_items: lineItems,
          mode: "payment",
          success_url: "http://localhost:5173/?success=true",
          cancel_url: "http://localhost:5173/?success=false",
          shipping_address_collection: {
            allowed_countries: ["US", "DZ", "FR"],
          },
          client_reference_id: order._id.toString(),
        });

        res.json({ sessionUrl: session.url, success: true });
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
      }
    });

    // Webhook
    app.post("/webhook", async (req, res) => {
      const header = req.headers["stripe-signature"];
      const payload = req.rawBody;

      try {
        const event = stripeInstance.webhooks.constructEvent(
          payload,
          header,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        if (event.type === "checkout.session.completed") {
          const orderId = event.data.object.client_reference_id;
          console.log("orderId:", orderId); // Add this line for debugging
          console.log(
            "client_reference_id:",
            event.data.object.client_reference_id
          ); // Add this line for debugging
          const order = await Order.findOne({ _id: orderId });
          if (order) {
            order.paymentStatus = "Payé";
            order.deliveryStatus = "En attente";
            order.email = event.data.object.customer_details.email;
            order.address.name = event.data.object.shipping_details.name;
            order.address.street =
              event.data.object.shipping_details.address.line1;
            order.address.city =
              event.data.object.shipping_details.address.city;
            order.address.state =
              event.data.object.shipping_details.address.state;
            order.address.postalCode =
              event.data.object.shipping_details.address.postal_code;
            order.address.country =
              event.data.object.shipping_details.address.country;
            order.paymentMethod = event.data.object.payment_method_types[0];
            order.orderID = event.data.object.id;
            await order.save();
            console.log("Payment status updated successfully.");
          } else {
            console.log("Order not found.");
          }
        }
      } catch (err) {
        console.error(err);
        return res.status(500).send("Error");
      }

      res.sendStatus(200);
    });

    app.listen(3001, () => console.log("Server is running at port 3001"));
  })
  .catch((err) => console.error("Error connecting to MongoDB", err));
