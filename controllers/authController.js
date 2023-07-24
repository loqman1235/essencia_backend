import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

export const register = async (req, res) => {
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
      return res
        .status(400)
        .json({ errors: [{ path: "email", msg: "Email already exists" }] });
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
      .json({ message: "Inscription réussie.", user: userDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const validationRules = [
      body("email").notEmpty().withMessage("L'adresse e-mail est requise."),
      body("password").notEmpty().withMessage("Le mot de passe est requis."),
    ];

    await Promise.all(validationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Adresse e-mail ou mot de passe invalide." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Adresse e-mail ou mot de passe invalide." });
    }

    const userDetails = user.toObject();
    delete userDetails.password;

    // Create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.status(200).json({
      message: "L'utilisateur a été connecté avec succès.",
      user: userDetails,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
