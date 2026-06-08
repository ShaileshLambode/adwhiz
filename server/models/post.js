const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Logo",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    props: {
        postType: {
            type: String,
            required: false
        },
        tone: {
            type: String,
            required: false
        },
        postName: {
            type: String,
            required: true
        },
        sector: {
            type: String,
            required: true
        },
        backgroundImageUrl: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: false
        },
    },
    favorite: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
