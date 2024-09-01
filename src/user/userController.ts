import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // Validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "Please provide all fields");
    return next(error);
  }

  // Database Call
  const user = await userModel.findOne({ email });

  if (user) {
    const error = createHttpError(400, "User already exists");
    return next(error);
  } 
 
  // Password Hashing
  const hashedPassword = await bcrypt.hash(password, 10);
  // Process
  // Response
  res.json({ message: "User created successfully" });
};

export { createUser };
