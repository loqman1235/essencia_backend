import Brand from "../models/brandModel.js";
import fs from "fs";
import { validationResult } from "express-validator";

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().populate("products");
    if (brands.length === 0) {
      return res.status(404).json({ message: "Marques introuvables" });
    }
    res.status(200).json({ brands });
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findOne({ _id: id });
    if (!brand) {
      return res.status(404).json({ message: "Marque introuvable" });
    }

    res.status(200).json({ brand });
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    const errors = {};

    if (!name || name.length === 0) {
      errors.name = "Le nom de la marque est requis.";
    }

    if (!req.file || req.file.length === 0) {
      errors.image = "L'image de la marque est requis.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(401).json({ errors });
    }

    const newBrand = await Brand.create({
      name,
      image: `uploads/${req.file.filename}`,
    });
    res.status(201).json({ success: true, brand: newBrand });
  } catch (error) {
    console.error(error);
    res.status(500).json("Something went wrong");
  }
};

// Delete a brand
export const removeBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ message: "Aucune marque trouvée" });
    }

    // Remove the associated image files
    if (fs.existsSync(`public/${brand.image}`)) {
      fs.unlinkSync("public/" + brand.image);
    }

    res.status(200).json({ message: "Marque supprimée avec succès" });
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la suppression du marque :",
      error
    );
    res.status(500).json({
      message: "Une erreur s'est produite lors de la suppression du marque",
    });
  }
};

// Update a brand
export const updateBrand = async (req, res) => {
  try {
    // Validate request body
    const errors = {};

    const { id } = req.params;
    const { name } = req.body;
    let updatedBrand = null;

    if (!name || name.trim() === "") {
      errors.name = "Le nom de la marque est requis.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(401).json({ errors });
    }

    if (req.file) {
      // If a new image is provided, update the brand's image path
      const image = `uploads/${req.file.filename}`;
      updatedBrand = await Brand.findByIdAndUpdate(
        id,
        { name, image },
        { new: true }
      );
    } else {
      // If no new image is provided, update only the name
      updatedBrand = await Brand.findByIdAndUpdate(id, { name }, { new: true });
    }

    res.status(200).json({
      message: "Marque mise à jour avec succès",
      updatedBrand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
