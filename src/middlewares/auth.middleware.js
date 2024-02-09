//This is the middleware used to get the user instance based on the tokens stored in the cookies
//We have used this in logout because we cannot find user using email or username as user only clicks on the logout button
//This is not only used in the logout can also be used in like,comment,post
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

//underscore in the parameter defines res(response) we can also replace with res
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        //req.header is to get the token from the header and can be tested using the postman
        //In header we get in the format of "Bearer token-value" so we have to remove the "Bearer " from the token by replacing bearer with empty string
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") 
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        console.log("This is token",token)

        //Here we decoding the token to get the id from the function 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("This is decoded token",decodedToken)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken"
        )
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        //below we are adding new object named user and assigning the user
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message|| "Invalid Access Token")
    }
})