import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    videos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: "This is a playlist."
    }
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema);