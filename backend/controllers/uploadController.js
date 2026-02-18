const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ตรวจสอบค่า Config เบื้องต้น
console.log("---------------- DEBUG ----------------");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  "API Key:",
  process.env.CLOUDINARY_API_KEY ? "FOUND ✅" : "MISSING ❌",
);
console.log("---------------------------------------");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
exports.uploadImage = async (req, res) => {
  console.log("🔥 UPLOAD CONTROLLER HIT");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
    }

    const localFilePath = req.file.path;

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "ariacer-app",
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      message: "Upload failed",
      error: error.message || error,
    });
  }
};
exports.uploadAvatarImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
    }

    const localFilePath = req.file.path;

    const storageName = req.body.identifier || "user_avatar_" + req.body.userId;

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "ariacer-app/avatars",
      public_id: storageName,
      overwrite: true,
      resource_type: "auto",
    });

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary Avatar Upload Error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      message: "Upload failed",
      error: error.message || error,
    });
  }
};

exports.uploadMiddleware = upload.single("file");
