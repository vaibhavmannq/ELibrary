import express, { NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app = express();

// Routes
// Http Methods: GET, POST, PUT, PATCH, DELETE
app.get("/", (req, res, next) => {
  res.json({ message: "Welcome to ELibrary API" });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
