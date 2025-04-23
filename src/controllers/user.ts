import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import prisma from "../config/prisma";
import APIResponse from "../utils/apiResponse";
import { platform } from "os";
import { link } from "fs";
import APIError from "../utils/apiError";

export const getUser = asyncWrapper( async(req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.userId}
    })
    return APIResponse.success(res, '', user)
})

export const updateUser = asyncWrapper( async(req: Request, res: Response) => {
    const updateData = req.body
    delete updateData.password
    const user = await prisma.user.update({
        where: { id: req.user?.userId },
        data: updateData
    })

    return APIResponse.success(res, "", user)
})

export const addSocial = asyncWrapper( async(req: Request, res: Response) => {
    if(!platform || !link){
        throw APIError.badRequest('Platform and link are required')
    }
    const data = await prisma.userSocials.create({
        data: {
            userId: req.user!.userId,
            ...req.body
        }
    })  
    return APIResponse.created(res, 'Social Link added successfully', data)  
})

export const deleteSocial = asyncWrapper( async(req: Request, res: Response) => {
    await prisma.userSocials.delete({
        where: { id: req.body.id}
    })    
    return APIResponse.success(res, 'Social Link removed successfully', null)
})