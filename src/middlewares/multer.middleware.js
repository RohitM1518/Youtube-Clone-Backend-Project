import multer from 'multer'
//refer multer documentation to store in diskStorage in github

//Below code is from multer readme.md github documentation =>diskStorage
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