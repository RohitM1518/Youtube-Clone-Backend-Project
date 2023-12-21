// require('dotenv').config({path:"./env"}) used to make all the env variable once the
import express from "express"
import dotenv from "dotenv"
import connectDB from "./db/index.js"


dotenv.config({
    path:"./env"
})

connectDB()
/*
const app = express()
    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => { 
                console.log("Error: Unable to connect", error) 
                throw error
            })
            app.listen(process.env.PORT, () => {
                console.log(`App is listening on port ${process.env.PORT}`)
            })
        } catch (error) {
            console.log("Error hello: ", error)
            throw error
        }
    })()
    */