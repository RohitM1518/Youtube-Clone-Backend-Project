import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true //Index helps to search in database
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            lowercase:true,
            index:true,
        },
        avatar:{
            type:String, //Cloudinary URL
            required:true,
        },
        coverimage:{
            type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String, //In database the password is stored as encrypted using bycryptjs package(npm install bcryptjs)
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String,

        }

    },{timestamps:true})

userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next(); //use only when user wants to store the password not during all the times like while updating the avatar or coverpage
    this.password = bcrypt.hash(this.password,10) //10 is number of rounds to be used to encrypt
    next()
    
}) 
//here we are not using the arrow function because arrow function wont save the context so we use normal function
//This pre will encrypty the passsword befaore saving the data in database


//custom method is PasswordCorrect
userSchema.methods.isPasswordCorrect = async function(password){ 
  return await bcrypt.compare(password,this.password)
   //returns true or false
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username:this.username,
            fullname:this.fullname //right side things are coming from database
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.Model("User",userSchema) //In mongodb "User" will be saved as "users"