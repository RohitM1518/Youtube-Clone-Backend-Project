import  express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"


const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}
)) //use method used whenever we use middleware, configuration
app.use(express.json({
    limit:"16kb"
}
))//This means I am accepting the json data to store the data in DB
app.use(express.urlencoded({extended:true,limit:"16kb"}))//This means I am accepting the url encoded with data to store the data in DB
app.use(express.static("public"))//This is to store some data which can be accessed by anyone such as pdf,photo
//public folder is already created so we are passing public
app.use(cookieParser())


//import routes
import userRoute from "./routes/user.routes.js"
import tweetsRoute from "./routes/tweet.routes.js"
import subscriptionRoute from "./routes/subscription.routes.js";
import healthCheckRoute from './routes/healthcheck.routes.js'
import playlistRoute from "./routes/playlist.routes.js"
import videoRoute from "./routes/video.routes.js"
import commentRoute from "./routes/comment.routes.js"
import likeRoute from "./routes/like.routes.js"
import dashboardRoute from "./routes/dashboard.routes.js"

app.use("/api/v1/users",userRoute) //use instead of app.get
//http://Localhost:8000/api/v1/users/register
app.use("/api/v1/tweets",tweetsRoute);
app.use("/api/v1/subscription",subscriptionRoute)
app.use("/api/v1/healthcheck",healthCheckRoute)
app.use("/api/v1/playlist", playlistRoute)
app.use("/api/v1/videos",videoRoute)
app.use("/api/v1/comments",commentRoute)
app.use("/api/v1/likes",likeRoute)
app.use("/api/v1/dashboard",dashboardRoute)

export {app}