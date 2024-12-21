const mongoose = require("mongoose");

// Define the Tags schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: { type: String },
    artImages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ArtImages",
        },
    ],
});

// Export the Tags model
module.exports = mongoose.model("Category", categorySchema);