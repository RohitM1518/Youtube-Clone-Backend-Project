import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Jwt } from "jsonwebtoken"

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        console.log("1")
        const accessToken= user.generateAccessToken()
        console.log("2")
        const refreshToken=user.generateRefreshToken()
        console.log("3")
        
        user.refreshToken = refreshToken;
        console.log("4")
        await user.save({validateBeforeSave:false})
        console.log("5")
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation — not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object
    // — create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { username, fullname, email, password } = req.body
    //console.log(username, fullname)

    // if(fullname==""){
    //     throw ApiError(400,"fullname is required")
    // }

    if ([fullname, email, username, password].some((feild) => feild?.trim() === "")) {
        throw ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username?.toLowerCase()
        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser)
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body —> data
    // username or email
    // find the user
    //password check
    //access and referesh token
    // send cookie

const {email,username,password}=req.body
if(!username && !email){
    throw new ApiError(400,"Email or Username is required")
}
const user=await User.findOne({
    $or:[{email},{username}]  //$or is the mongodb operator
})

if(!user){
    throw new ApiError(404,"User Does not Exists")
}

const isPasswordValid=await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401,"Invalid user Credentials")
}

const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options={
    httpOnly:true,
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(
    200,
    {user:loggedInUser,accessToken,refreshToken},
    "User Logged In Successfully"
))

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            },
           
        },
        {
            new:true
        })
        const options={
            httpOnly:true,
            secure:true
        }

        return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken,
            process.env.REFERSH_TOKEN_SECRET    
        )
    
        const user =await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired or used")
        }
        const options={
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,newrefreshToken}=await  generateAccessAndRefreshToken(user._id)
    
          return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken",newrefreshToken).json(new ApiResponse(200,{accessToken:accessToken,refreshToken:newrefreshToken},"Access Token Refreshed"))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refresh Token")
    }

})
export { registerUser, loginUser,logoutUser,refreshAccessToken }