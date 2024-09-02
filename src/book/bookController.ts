import path from "node:path";
import fs from "node:fs";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import { AuthRequest } from "../middleware/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  // 'application/pdf'
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    try {
      // delete temp files
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
    } catch (err) {
      console.log(err);
      return next(createHttpError(500, "Error in deleting temporary files"));
    }

    res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Something went wrong"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() != _req.userId) {
    return next(
      createHttpError(403, "You are not authorized to update this book")
    );
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage: string = "";
  let completeFileName: string = "";

  try {
    if (files.coverImage) {
      const filename = files.coverImage[0].filename;
      const coverMimeType = files.coverImage[0].mimetype.split("/").at(-1);

      // send files to cloudinary
      const filePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        filename
      );
      completeCoverImage = filename;
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: completeCoverImage,
        folder: "book-covers",
        format: coverMimeType,
      });

      completeCoverImage = uploadResult.secure_url;
      await fs.promises.unlink(filePath);
    }

    if (files.file) {
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        files.file[0].filename
      );

      const bookFileName = files.file[0].filename;
      completeFileName = `${bookFileName}.pdf`;

      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: completeFileName,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      {
        _id: bookId,
      },
      {
        title: title,
        genre: genre,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFileName ? completeFileName : book.file,
      },
      { new: true }
    );

    res.json(updatedBook);
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error in updating book"));
  }
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const books = await bookModel.find().skip(skip).limit(limit);
    const totalBooks = await bookModel.countDocuments();

    res.json({
      page,
      limit,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
      books,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error in listing books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    return res.json(book);
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error in getting book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() != _req.userId) {
    return next(
      createHttpError(403, "You are not authorized to delete this book")
    );
  }

  const coverFileSplits = book.coverImage.split("/");
  const coverImagePublicId =
    coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

  const bookFileSplits = book.file.split("/");
  const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
  console.log("bookFilePublicId", bookFilePublicId);

  try {
    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(bookFilePublicId, {
      resource_type: "raw",
    });
  } catch (err) {
    console.error("Error in deleting files from Cloudinary:", err);
    throw createHttpError(500, "Error in deleting files from Cloudinary");
  }

  await bookModel.deleteOne({ _id: book });

  return res.sendStatus(204);
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
