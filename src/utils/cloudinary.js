//Multer is used to upload the file to our server and cloudinary is used to upload the file to cloudinary


import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs' //This is the file system from the node js
//used to manage the filesystem like read,open,close  
//refer node js documentation for this
//Tod delete we use unlink, whenever the file is uploaded from server(local) to clodinary we will unlink the file

//copy paste the below config code from clodinary website
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//We get localFilePath from multer middleware
const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto" //detects on its own whether it is pdf,image etc
        })
        //file uploaded successfully
        fs.unlinkSync(localFilePath) 
       // console.log("File is uploaded on cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally stored temproary file as the upload operation is failed
        return null;
    }
}


export {uploadOnCloudinary}