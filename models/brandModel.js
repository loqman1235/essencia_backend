import mongoose from "mongoose";
import Product from "./productModel.js";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // brand has many products
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
