const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"  // Reference to the User model
    },
    date: {
        type: Date,
        default: Date.now  // Automatically sets the post's date to the current date
    },
    content: String,  // Content of the post
    likes: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Array of user references for likes
    ],
});

module.exports = mongoose.model("Post", postSchema); // Ensure the model is exported with the correct name
