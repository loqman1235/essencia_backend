import Brand from "../models/brandModel.js";
import cloudinary from "../utils/cloudinary.js";

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

    const brandImageResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "essencia/brands",
    });

    const newBrand = await Brand.create({
      name,
      image: {
        public_id: brandImageResult.public_id,
        url: brandImageResult.secure_url,
      },
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
    const existingBrand = await Brand.findById(id);

    if (!existingBrand) {
      return res.status(404).json({ message: "Aucune marque trouvée" });
    }

    if (existingBrand.image.public_id) {
      await cloudinary.uploader.destroy(existingBrand.image.public_id);
    }

    await Brand.findByIdAndDelete(id);

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

    if (!name || name.trim() === "") {
      errors.name = "Le nom de la marque est requis.";
    }

    // If a new brand image is provided, upload it to Cloudinary
    let brandImageResult = {};
    if (req.file) {
      // Remove the existing brand image from Cloudinary
      const existingBrand = await Brand.findById(id);
      if (existingBrand.image.public_id) {
        await cloudinary.uploader.destroy(existingBrand.image.public_id);
      }

      // Upload new brand image
      brandImageResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "essencia/brands",
      });
    }

    if (Object.keys(errors).length > 0) {
      return res.status(401).json({ errors });
    }

    const updatedFields = {
      name,
    };

    if (req.file) {
      updatedFields.image = {
        public_id: brandImageResult.public_id,
        url: brandImageResult.secure_url,
      };
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json({
      message: "Marque mise à jour avec succès",
      updatedBrand,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
