import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // Validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "Please provide all fields");
    return next(error);
  }

  // Database Call
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(400, "User already exists");
      return next(error);
    }
  } catch (err) {
    return next(createHttpError(500, "Error in finding user"));
  }

  // Password Hashing
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error in creating user"));
  }

  try {
    // Token Generation JWT
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // Response
    res.status(201).json({ accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "Error in creating token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "Please provide email and password"));
  }

  let user: User | null;
  try {
    user = await userModel.findOne({ email });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
  } catch (err) {
    return next(createHttpError(500, "Error in finding user"));
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(createHttpError(400, "Invalid credentials"));
    }
  } catch (err) {
    return next(createHttpError(500, "Error in comparing passwords"));
  }

  try {
    // Create access token
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.json({ accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "Error in creating access token"));
  }
};

export { createUser, loginUser };
