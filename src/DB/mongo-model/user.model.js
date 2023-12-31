import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    userName: {
        type: String,
        required: true,
        lowercase:  true,
        trim: true,
        unique: true
    },
    IP: {
        type: String,
        required: true
    }

})

export const User = mongoose.model('User',userSchema)
