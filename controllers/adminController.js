import Admin from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const validationRules = [
      body("username")
        .escape()
        .notEmpty()
        .withMessage("Le nom d'utilisateur est requis."),
      body("email")
        .escape()
        .notEmpty()
        .withMessage("L'adresse e-mail est requise.")
        .isEmail()
        .withMessage("Adresse e-mail invalide"),
      body("password")
        .escape()
        .notEmpty()
        .withMessage("Le mot de passe est requis.")
        .isLength({ min: 6 })
        .withMessage("Le mot de passe doit comporter au moins 6 caractères"),
    ];

    await Promise.all(validationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const registeredAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    res
      .status(200)
      .json({ message: "Registred Successfully", user: registeredAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
};

// Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const validationRules = [
      body("email")
        .escape()
        .notEmpty()
        .withMessage("L'adresse e-mail est requise."),
      body("password")
        .escape()
        .notEmpty()
        .withMessage("Le mot de passe est requis."),
    ];
    await Promise.all(validationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res
        .status(400)
        .json({ error: "Adresse e-mail ou mot de passe invalide." });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);

    if (!passwordMatches) {
      return res
        .status(400)
        .json({ error: "Adresse e-mail ou mot de passe invalide." });
    }

    const adminDetails = admin.toObject();
    delete adminDetails.password;

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({
      message: "Admin has been successfully logged in",
      admin: adminDetails,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during login" });
  }
};
