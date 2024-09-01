import express, { NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";

const app = express();
app.use(express.json());

// Routes
// Http Methods: GET, POST, PUT, PATCH, DELETE
app.get("/", (req, res, next) => {
  res.json({ message: "Welcome to ELibrary API" });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter); 

// Global Error Handler
app.use(globalErrorHandler);

export default app;
