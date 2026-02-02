require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const issueRoutes = require("./routes/issueRoutes");
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemsRoutes");
const configRoutes = require("./routes/configRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/issues", issueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/config", configRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(port, () => console.log(`Server running on port ${port}`));