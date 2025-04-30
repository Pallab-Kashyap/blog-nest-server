import prisma from "../config/prisma";
import bcrypt from 'bcrypt'
import asyncWrapper from "../utils/asyncWrapper";
import { Request , Response } from 'express'
import APIError from "../utils/apiError";
import APIResponse from "../utils/apiResponse";
import { generateAccessToken, generateRefershToken } from "../utils/tokens";

const validateEmailAndPassword = ({email, password}: {email: string, password: string}) => {
    if(!email || !password){
       throw APIError.badRequest('Email & password are required')
    }
    if(!/\S+@\S+\.\S+/.test(email)){
        throw APIError.badRequest('Invalid email')
    }
    if(password.length < 8){
        throw APIError.badRequest('Password must be at least 8 characters')
    }
}

export const createUser = asyncWrapper( async(req: Request, res: Response) => {
    const { username, email, password } = req.body

    if(!username || !email || !password){
        throw APIError.badRequest('all fields are required')
    }

    validateEmailAndPassword({email, password})

    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if( existingUser ){
        throw APIError.badRequest('Emial ID already exist with another account, try login')
   }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
        select: {
            id: true
        }
    })

    if(user){

        const accessToken = generateAccessToken({userId: user.id})
        const refreshToken = generateRefershToken({userId: user.id})

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: hashedRefreshToken,
            }
        })

        res.cookie('token', {accessToken, refreshToken}, {
            httpOnly: true,
            secure: false, 
        })
        return APIResponse.created(res, 'user created successfully', { accessToken, refreshToken})
    }

    throw APIError.internal('something went wrong')
})

export const login = asyncWrapper(  async(req: Request, res: Response) => {
    const { email, password } = req.body

    validateEmailAndPassword({email, password})

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    })

    if(!user){
        throw APIError.badRequest('Invalid credentials')
    }

    const isMatch = bcrypt.compare(password, user.password)

    if(!isMatch){
        throw APIError.badRequest('Invalid password')
    }

    const accessToken = generateAccessToken({userId: user.id})
    const refreshToken = generateRefershToken({userId: user.id})

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: hashedRefreshToken,
        }
    })

    res.cookie('token', {accessToken, refreshToken}, {
        httpOnly: true,
        secure: false, 
    })

    return APIResponse.created(res, 'user created successfully', { accessToken, refreshToken})

})

export const updatePassword = asyncWrapper( async(req: Request, res: Response) => {
    const { password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { id: req.user?.userId },
        data: { password: hashedPassword }
    })
})
