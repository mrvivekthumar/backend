const express = require("express");
const app = express();
const dotenv = require("dotenv");
const database = require("./config/database");
const cors = require("cors");

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const contactRoutes = require("./routes/contact");
const artImagesRoutes = require("./routes/ArtImages");

const cookieParser = require("cookie-parser");
const { cloudinaryConnect } = require("./config/cloudinary");
dotenv.config();
const PORT = process.env.PORT || 4000;

database.connect();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

//cloudinary connection
cloudinaryConnect();

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/artImages", artImagesRoutes);
app.use("/api/v1/contact", contactRoutes);

app.get("/test", (req, res) => {
    return res.json({
        success: true,
        message: 'Your server is up and running....'
    });
});

app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`)
})