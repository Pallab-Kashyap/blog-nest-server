import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/apiError";
import prisma from "../config/prisma";
import APIResponse from "../utils/apiResponse";

function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  function calculateReadTime(text: string): number {
    const wordsPerMinute = 200;
    const words = countWords(text);
    return Math.ceil(words / wordsPerMinute); 
  }
  

export const getAllPost = asyncWrapper( async(req: Request, res: Response) => {
    const post = await prisma.post.findMany({
        select: {
            title: true,
            description: true,
            estimatedReadTime: true,
            authorId: true,
            stats: true
        }
    })
    return APIResponse.success(res, '', post)
})

export const getPostDetailsById = asyncWrapper(async (req: Request, res: Response) => {
    const postId = req.params.Id; 

    const findPost = prisma.post.findUnique({
        where: { id: postId },
        select: {
            id: true,
            title: true,
            description: true,
            content: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,

        }
    });

    const findUpvote = prisma.upvote.findUnique({
        where: {
            userId_postId: {
                userId: req.user!.userId,
                postId: postId
            }
        },
        select: {
            userId: true
        }
    });

    const [post, upvoted] = await Promise.all([findPost, findUpvote]);

    const resData = {
        post,
        isUpvoted: !!upvoted 
    };

    return APIResponse.success(res, '', resData);
});

export const getUserPost = asyncWrapper( async(req: Request, res: Response) => {
    const post = await prisma.post.findMany({
        where: { authorId: req.user!.userId },
        select: {
            title: true,
            description: true,
            estimatedReadTime: true,
            authorId: true,
        }
    })
    return APIResponse.success(res, '', post)
})

export const publishPost = asyncWrapper( async(req: Request, res: Response) => {
    const { title, content, description } = req.body

    if(title){
        throw APIError.badRequest('Title is required')
    }

    if(!content || content.length === 0){
        throw APIError.badRequest("Content is required")
    }

    if(!description){

    }

    if(description.length > 30){

    }

    const post = await prisma.post.create({
        data: {
            authorId: req.user!.userId,
            title,
            description: req.body.description || content.slice(0, 40).trim() + '...',
            content,
            estimatedReadTime: calculateReadTime(content),
            status: "PUBLISHED"
        }
    })

    return APIResponse.created(res, 'Post created', { id: post.id, estimatedReadTime: post.estimatedReadTime })
})

export const updatePost = asyncWrapper( async(req: Request, res: Response) => {
    const { title, content } = req.body

    if(title){
        throw APIError.badRequest('Title is required')
    }

    if(!content || content.length === 0){
        throw APIError.badRequest("Content is required")
    }

    await prisma.post.update({
        where: { id: req.params.id, authorId: req.user?.userId },
        data: {
            title,
            content,
            estimatedReadTime: calculateReadTime(content)
        }
    })

    return APIResponse.created(res, 'Updated successfully', null)
})

export const archivePost = asyncWrapper( async(req: Request, res: Response) => {
    await prisma.post.update({
        where: { id: req.params.id, authorId: req.user!.userId },
        data: {
            status: "ARCHIVED"
        }
    })
})

export const deletePost = asyncWrapper( async(req: Request, res: Response) => {
    await prisma.post.delete({
        where: { id: req.params.id, authorId: req.user?.userId },
    })
})

export const upvotePost = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const postId = req.params.id;
  
    try {
      const [upvote, updatedStats] = await prisma.$transaction([
        prisma.upvote.create({
          data: { userId, postId },
        }),
  
        prisma.postStats.update({
          where: { postId },
          data: {
            upvotes: { increment: 1 },
          },
        }),
      ]);
  
      return APIResponse.success(res, 'Post upvoted successfully', updatedStats);
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw APIError.badRequest('You have already upvoted this post');
      }
      throw err;
    }
  });

  export const removeUpvote = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const postId = req.params.id;
  
    try {
      const [deletedUpvote, updatedStats] = await prisma.$transaction([
        prisma.upvote.delete({
          where: { userId_postId: { userId, postId } },
        }),
  
        prisma.postStats.update({
          where: { postId },
          data: {
            upvotes: { decrement: 1 },
          },
        }),
      ]);
  
      return APIResponse.success(res, 'Upvote removed', updatedStats)
    } catch (err: any) {
      if (err.code === 'P2025') {
        return APIError.badRequest('You have not upvoted this post');
      }
      throw err;
    }
  });

  export const savePost = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const postId = req.params.id;
  
    try {
      await prisma.save.create({
        data: { userId, postId },
      });
  
      return APIResponse.success(res, 'Post saved successfully', null);
    } catch (err: any) {
      if (err.code === 'P2002') {
        return APIError.badRequest('You have already saved this post');
      }
      throw err;
    }
  });
  
  export const removeSave = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const postId = req.params.id;
  
    try {
      await prisma.save.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });
  
      return APIResponse.success(res, 'Save removed successfully', null);
    } catch (err: any) {
      if (err.code === 'P2025') {
        return APIError.badRequest('You have not saved this post');
      }
      throw err;
    }
  });
  
  

