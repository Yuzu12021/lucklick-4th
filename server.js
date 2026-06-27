import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("LuckLick photo contest server is running!");
});

app.get("/test-upload", async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      "https://picsum.photos/800/600",
      {
        folder: "lucklick/photo-contest-2026",
      }
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.post("/api/entry", upload.single("photo"), async (req, res) => {
  try {
    console.log("応募データ:", req.body);
    console.log("画像:", req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ message: "画像がありません" });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "lucklick/photo-contest-2026",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const gasResponse = await fetch(process.env.GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerName: req.body.ownerName,
        dogName: req.body.dogName,
        instagram: req.body.instagram,
        title: req.body.title,
        comment: req.body.comment,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }),
    });

    const gasResult = await gasResponse.json();

    if (!gasResult.success) {
      throw new Error(
        gasResult.message || "スプレッドシートへの記録に失敗しました"
      );
    }

    res.json({
      message: "応募を受け付けました",
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "応募の送信に失敗しました",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running: http://localhost:3000");
});