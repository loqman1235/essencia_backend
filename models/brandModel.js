import mongoose from "mongoose";
import Product from "./productModel.js";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // brand has many products
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
