import express from "express";

const app = express();

// Routes
// Http Methods: GET, POST, PUT, PATCH, DELETE
app.get("/", (req, res) => {
  res.json({ message: "Welcome to ELibrary API" });
});

export default app;
