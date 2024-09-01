import path from "node:path";
import express from "express";
import { createBook } from "./bookController";
import multer from "multer";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  // put limit 10mb max
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// routes
bookRouter.post("/", upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
]), createBook);

export default bookRouter;
