import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'
import errorHandler from "./middlewares/globalErrorHandler"
import cookieParser from "cookie-parser"

import userRouter from "./routers/userRouter";
import postRouter from "./routers/postRouter";
import authRouter from "./routers/authRouter";

dotenv.config()

const app = express()

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/auth", authRouter);


app.use(errorHandler)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server is listening on port: ${port}`))