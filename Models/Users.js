import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name:{type:String},
    email:{type:String},
    password:{type:String},
    avatar:{type:String},
    uploadedVideos: [
        {
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          filePath: {
            type: String,
            required: true,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    
})

const User=mongoose.model("User",UserSchema);
export default User