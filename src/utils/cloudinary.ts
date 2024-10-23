import express from "express";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: "/home/am-pc-02/invoice-api/.env" });

export const uploadOnCloudinary = async (
  localFilePath: string,
  res: express.Response
) => {
  try {
    await cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!localFilePath) {
      return res.status(406).json({
        message: "No file path found",
      });
    }

    // Check if the file exists before uploading
    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    // Delete the local file after upload
    fs.unlinkSync(localFilePath);

    return uploadResult.url;
  } catch (error: any) {
    fs.unlinkSync(localFilePath);
    return res.status(500).json(error);
  }
};
