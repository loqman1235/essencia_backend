import User from "../models/userModel.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    const userWithoutPass = user.toObject();
    delete userWithoutPass.password;

    res.status(200).json({ success: true, user: userWithoutPass });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "Aucune utilisateur trouvée" });
    }

    res.status(200).json({ message: "Utilisateur supprimée avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Create user
export const createUser = async (req, res) => {
  try {
    const { username, email, address, password, password_conf } = req.body;
    const validationRules = [
      body("username")
        .notEmpty()
        .escape()
        .withMessage("Le nom d'utilisateur est requis."),
      body("email")
        .notEmpty()
        .escape()
        .withMessage("L'adresse e-mail est requise.")
        .isEmail()
        .withMessage("Adresse e-mail invalide"),
      body("address").notEmpty().escape().withMessage("L'adresse est requise."),
      body("password")
        .notEmpty()
        .escape()
        .withMessage("Le mot de passe est requis.")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit comporter au moins 6 caractères"),
      body("password_conf")
        .notEmpty()
        .escape()
        .withMessage("La confirmation du mot de passe est requise.")
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Les mots de passe ne correspondent pas.");
          }
          return true;
        }),
    ];

    await Promise.all(validationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    // Existing User
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        errors: [{ path: "email", msg: "L'adresse e-mail existe déjà" }],
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create User
    const newUser = await User.create({
      username,
      email,
      address,
      password: hashedPassword,
    });

    const userDetails = newUser.toObject();
    delete userDetails.password;

    res
      .status(200)
      .json({ message: "Utilisateur créé avec succès.", user: userDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, address, password, password_conf } = req.body;
    const validationRules = [
      body("username")
        .notEmpty()
        .escape()
        .withMessage("Le nom d'utilisateur est requis."),
      body("email")
        .notEmpty()
        .escape()
        .withMessage("L'adresse e-mail est requise.")
        .isEmail()
        .withMessage("Adresse e-mail invalide"),
      body("address").notEmpty().escape().withMessage("L'adresse est requise."),
      body("password")
        .notEmpty()
        .escape()
        .withMessage("Le mot de passe est requis.")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit comporter au moins 6 caractères"),
      body("password_conf")
        .notEmpty()
        .escape()
        .withMessage("La confirmation du mot de passe est requise.")
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Les mots de passe ne correspondent pas.");
          }
          return true;
        }),
    ];

    await Promise.all(validationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user details
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        address,
        password: hashedPassword,
      },
      { new: true }
    );
    res.status(200).json({
      message: "Utilisateur mise à jour avec succès",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Une erreur s'est produite lors de la mise à jour d'utilisateur",
    });
  }
};
