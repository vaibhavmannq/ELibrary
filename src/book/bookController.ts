import { Request, Response, NextFunction } from "express";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
    const {} = req.body;
    
  res.json({ message: "Book Controller" });
};

export { createBook };
