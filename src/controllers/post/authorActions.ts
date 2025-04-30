import { Request, Response } from "express";
import asyncWrapper from "../../utils/asyncWrapper";
import APIError from "../../utils/apiError";
import prisma from "../../config/prisma";
import APIResponse from "../../utils/apiResponse";

function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

function calculateReadTime(text: string): number {
    const wordsPerMinute = 200;
    const words = countWords(text);
    return Math.ceil(words / wordsPerMinute); 
}


export const getUserPost = asyncWrapper( async(req: Request, res: Response) => {
  console.log('IN');
    const post = await prisma.post.findMany({
        where: { authorId: req.user!.userId },
        include: {
          stats: true
        }
    })
    console.log(post);
    return APIResponse.success(res, '', post)
})

export const publishPost = asyncWrapper( async(req: Request, res: Response) => {
  console.log(req.body);
    const { title, content } = req.body

    if(!title || title.trim() === ""){
        throw APIError.badRequest('title is required')
    }

    if(!content || content.trim() === ""){
        throw APIError.badRequest("content is required")
    }

    const post = await prisma.post.create({
        data: {
            authorId: req.user!.userId,
            title,
            description: req.body.description || content.slice(0, 40).trim() + '...',
            content,
            estimatedReadTime: calculateReadTime(content),
            status: "PUBLISHED",
           stats: {
            create: {
              views: 0,
              upvotes: 0
            }
           }
        }
    })

    return APIResponse.created(res, 'Post created', { id: post.id, estimatedReadTime: `${post.estimatedReadTime}m` })
})

export const updatePost = asyncWrapper( async(req: Request, res: Response) => {
    const { title, content } = req.body

    
    if ("title" in req.body && title?.trim() === "") {
      throw APIError.badRequest('Title is required');
    }
    
    if ("content" in req.body && content?.trim() === "") {
      throw APIError.badRequest('Content is required');
    }

    const updateData: any = {}

    if("title" in req.body){
      updateData.title = title
    }

    if("content" in req.body){
      updateData.content = content
      updateData.estimatedReadTime = calculateReadTime(content)
    }
    
    await prisma.post.update({
        where: { id: req.params.id, authorId: req.user?.userId },
        data: updateData
    })

    return APIResponse.created(res, 'Updated successfully', null)
})

export const updatePostStatus = asyncWrapper( async(req: Request, res: Response) => {

  if(!["ARCHIVED", "PUBLISHED"].includes(req.body.action)){
    throw APIError.badRequest('Invalid action, please choose "ARCHIVED" or "PUBLISHED"')
  }

  try {
      await prisma.post.update({
          where: { id: req.params.id, authorId: req.user!.userId },
          data: {
              status: req.body.action
          }
      })
      return APIResponse.success(res, `Post is ${req.body.action} now`, null)
  } catch (error: any) {
      if(error.code === "P2025"){
        throw APIError.badRequest('Post not found')
      }
      throw error
  }
})

export const deletePost = asyncWrapper( async(req: Request, res: Response) => {
    try {
      await prisma.post.delete({
          where: { id: req.params.id, authorId: req.user?.userId },
      })
      return APIResponse.success(res, `Post is deleted`, null)
    } catch (error: any) {
      if(error.code === "P2025"){
        throw APIError.badRequest('Post not found')
      }
      throw error
    }
})
  
  

