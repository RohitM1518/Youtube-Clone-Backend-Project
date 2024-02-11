import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";
import { asyncHandler } from "./asyncHandler.js";

export const getuserbyusername = async(username)=>
{
    const userbyusername=await User.findOne({ username: username });
    if(!userbyusername){
        throw new ApiError(404,'User not found')
    }
    
    return userbyusername;
}