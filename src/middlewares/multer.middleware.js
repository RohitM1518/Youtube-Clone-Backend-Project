//Multer is used to upload the file to our server and cloudinary is used to upload the file to cloudinary

import multer from 'multer'
//refer multer documentation to store in diskStorage in github

//Below code is from multer readme.md github documentation =>diskStorage
//Below code will return the localpath which will be passed for clodirnary method in utils
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp') //store file temp in public/temp
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)  //we are storing using the name given by the user we can also store using unique name(refer documentation)
    }
})

export const upload = multer(
    {
        storage: storage
    }
)