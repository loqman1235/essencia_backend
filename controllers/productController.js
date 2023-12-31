import Product from "../models/productModel.js";
import Brand from "../models/brandModel.js";
import cloudinary from "../utils/cloudinary.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("brand", "-products");

    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id }).populate(
      "brand",
      "-products"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "No product found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, volume, price, brandId } = req.body;
    const errors = {};

    if (!name || name.length === 0) {
      errors.name = "Le nom du produit est requis.";
    }

    if (!description || description.length === 0) {
      errors.description = "La description du produit est requise.";
    }

    if (!volume || volume.length === 0) {
      errors.volume = "Le volume du produit est requis.";
    }
    if (!price || price.length === 0) {
      errors.price = "Le prix du produit est requis.";
    }

    // Handle photo upload
    if (!req.files || req.files.length === 0) {
      errors.photos = "Au moins 1 photo est requise";
    }

    if (!brandId || brandId.length === 0) {
      errors.brand = "La marque du produit est requise.";
    }

    const brand = await Brand.findById(brandId);

    if (!brand) {
      errors.brand = "La marque spécifiée est introuvable.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(401).json({ message: "Validation Errors", errors });
    }

    const photosResult = await Promise.all(
      req.files.map(async (img) => {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          img.path,
          {
            folder: "essencia/products",
          }
        );
        return { url: secure_url, public_id };
      })
    );

    const newProduct = await Product.create({
      name,
      description,
      volume,
      price,
      images: photosResult,
      brand: brand._id,
    });

    brand.products.push(newProduct._id);
    await brand.save();

    delete newProduct.brand.products;

    res.status(201).json({
      message: "Produit créée avec succès",
      newProduct,
    });
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la création de produit :",
      error
    );
    res.status(500).json({
      message: "Une erreur s'est produite lors de la création de produit",
    });
  }
};

// Delete a product
export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Aucune produit trouvée" });
    }

    // Remove existing images from cloudinary
    if (existingProduct.images && existingProduct.images.length > 0) {
      const publicIds = existingProduct.images.map((img) => img.public_id);
      await Promise.all(
        publicIds.map(async (publidId) => {
          await cloudinary.uploader.destroy(publidId);
        })
      );
    }

    // Remove Product
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Produit supprimée avec succès" });
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la suppression du produit :",
      error
    );
    res.status(500).json({
      message: "Une erreur s'est produite lors de la suppression du produit",
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, volume, price, brandId } = req.body;

    const errors = {};

    if (!name || name.length === 0) {
      errors.name = "Le nom du produit est requis.";
    }

    if (!description || description.length === 0) {
      errors.description = "La description du produit est requise.";
    }

    if (!volume || volume.length === 0) {
      errors.volume = "Le volume du produit est requis.";
    }

    if (!price || price.length === 0) {
      errors.price = "Le prix du produit est requis.";
    }

    if (!brandId || brandId.length === 0) {
      errors.brand = "La marque du produit est requise.";
    }

    const brand = await Brand.findById(brandId);

    if (!brand) {
      errors.brand = "La marque spécifiée est introuvable.";
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return res.status(404).json({ message: "Aucune produit trouvée" });
    }

    if (Object.keys(errors).length > 0) {
      return res.status(401).json({ message: "Validation Errors", errors });
    }

    // Handle photo upload
    let photosResult = [];
    if (req.files && req.files.length > 0) {
      // New images provided, upload them to Cloudinary
      photosResult = await Promise.all(
        req.files.map(async (img) => {
          const { secure_url, public_id } = await cloudinary.uploader.upload(
            img.path,
            {
              folder: "essencia/products",
            }
          );
          return { url: secure_url, public_id };
        })
      );

      // Remove existing images from Cloudinary
      if (existingProduct.images && existingProduct.images.length > 0) {
        const publicIds = existingProduct.images.map((img) => img.public_id);
        await Promise.all(
          publicIds.map(async (publidId) => {
            await cloudinary.uploader.destroy(publidId);
          })
        );
      }
    } else {
      // No new images provided, keep existing images
      photosResult = existingProduct.images;
    }

    const updatedFields = {
      name: name,
      description: description,
      volume: volume,
      price: price,
      images: photosResult,
      brand: brand._id,
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json({
      message: "Produit mise à jour avec succès",
      updatedProduct,
    });
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la mise à jour du produit :",
      error
    );
    res.status(500).json({
      message: "Une erreur s'est produite lors de la mise à jour du produit",
    });
  }
};
