import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        // console.log("User in method",user)
        const accessToken = user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        //we are storing refresh token in database only for logged-in users not for the new registered ones
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }) //validateBeforeSave is set to false because we are not validating the password while saving the refresh token
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
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
    //console.log("USername fullname email and password",username, fullname,email,password)

    // if(fullname==""){
    //     throw ApiError(400,"fullname is required")
    // }

    if ([fullname, email, username, password].some((feild) => feild?.trim() === "")) {
        // field represents each element of the array during iteration.
        // field?.trim() trims any leading or trailing whitespaces from the value of field. The ?. is the optional chaining operator, which prevents an error if field is null or undefined.
        // === "" checks if the trimmed value is an empty string.
        throw ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    
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
        "-password -refreshToken" //This means we are not sending the password and refreshToken to the frontend
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
    // send tokens using cookie

    const { email, username, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "Email or Username is required")
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]  //$or is the mongodb operator
    })

    if (!user) {
        throw new ApiError(404, "User Does not Exists")
    }

    //In below code we have to use user not User because we are using the instance of the user and methods are present in the instance not in the class
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // console.log("accessToken", accessToken)
    // console.log("refreshToken", refreshToken)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    //or user.refreshToken = refreshToken

    const options = {
        httpOnly: true, //This means that the cookie can only be accessed by the server
        secure: true
    }


    //The reason we are sending tokens in both cookies and response so that user can store 
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User Logged In Successfully"
        ))

})

const logoutUser = asyncHandler(async (req, res) => {
    //We have used auth middleware in logout because we cannot find user using email or username as user only clicks on the logout button
    //Have to clear the refresh token from the database and also have to clear the cookies from the browser
    //logout is done using the auth middleware(user defined)
    //auth middleware is used to get the user instance based on token
    //added req.user from auth middleware is used here to get user
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1 //This is used to remove the refresh token from the database
            },

        },
        {
            new: true //This is to get the updated instance of the user(refreshToken = undefined) rather then old where there is a refresh token value
        })
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged Out"))
})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    console.log("incoming refresh token", incomingRefreshToken)
    if (!incomingRefreshToken || incomingRefreshToken === "null") {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify( 
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken", refreshToken,options).json(new ApiResponse(200, { accessToken: accessToken, refreshToken: refreshToken }, "Access Token Refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    // console.log("User ",user)
   // console.log("Old password is:  ",oldPassword,"\nNew Password is : ",newPassword);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false }) //validateBeforeSave is set to false because we are not validating the password while saving the refresh token

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Password Updated Successfully"
    ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
   // console.log("fullname", fullname, "email", email)
    if (!fullname && !email) {
        throw new ApiError(400, "All feilds are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: { fullname, email: email }
    }, { new: true }).select("-password") //This option, when set to true, instructs Mongoose to return the modified document rather than the original one. 

    console.log("Successfull ")
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account Details Updated Successfully"
    ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const localAvatarPath = req.file?.path
    //TODO: Delete the old avatar from cloudinary
    if (!localAvatarPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(localAvatarPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Avatar Successfully Updated"))
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    //TODO: Delete the old cover from cloudinary

    const localCoverImagePath = req.file?.path

    if (!localCoverImagePath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const coverImage = await uploadOnCloudinary(localCoverImagePath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Cover Image Successfully Updated"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params //username is the username of the user whose channel profile we want to see and we are getting it from the url
    //console.log("username ",username)
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            //Below {} are the pipelines or stages
            $match: { //match is used to find document based on the username and we get document on this stage
                username: username?.toLowerCase()
            },
        },
        {
            $lookup: { //lookup is used to get all the documents based on the condition
                from: "subscriptions", //Subscription => subscriptions
                localField: "_id",
                foreignField: "channel", //Here we will get the subscribers
                as: "subscribers"
            }
        },
        {
            $lookup: { //lookup is used to get all the documents based on the condition
                from: "subscriptions", //Subscription => subscriptions
                localField: "_id",
                foreignField: "subscriber", //Here we will get the channels to which the user has subscribed
                as: "subscibedTo"
            }
        },
        {
            $addFields: { //addFields is used to add new fields to the document
                subscribersCount:
                {
                    $size: "$subscribers"
                },
                subscribedToCount:
                {
                    $size: "$subscibedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos", //Video => videos
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner" //This will return first elemnt of an owner array and overwrites owner 
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails, updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile
}