import express from "express"
import dotenv from 'dotenv'
import cors from 'cors'
import errorHandler from "./middlewares/globalErrorHandler"

dotenv.config()

const app = express()

app.use(cors({
    origin: '*'
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(errorHandler)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server is listening on port: ${port}`))