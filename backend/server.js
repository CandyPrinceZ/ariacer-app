require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("./cron.js");

const issueRoutes = require("./routes/issueRoutes");
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemsRoutes");
const configRoutes = require("./routes/configRoutes");
const ServerRoutes = require("./routes/serverRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/issues", issueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/config", configRoutes);
app.use("/api/servers", ServerRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
