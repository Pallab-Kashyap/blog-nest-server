import { Request, Response } from "express";
import asyncWrapper from "../../utils/asyncWrapper";
import prisma from "../../config/prisma";
import APIResponse from "../../utils/apiResponse";
import APIError from "../../utils/apiError";
import { verifyToken } from "../../utils/tokens";

export const extractUserIdFromRequest = (req: Request): string | null => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token?.accessToken) {
    token = req.cookies.token?.accessToken;
  }

  if (token) {
    try {
      const decoded = verifyToken(token) as { userId: string };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  return null;
};


export const getAllPosts = asyncWrapper(async (req: Request, res: Response) => {
    const userId = extractUserIdFromRequest(req);
  
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        estimatedReadTime: true,
        author: {
          select: { id: true, username: true },
        },
        ...(userId && {
          upvotes: {
            where: { userId },
            select: { userId: true },
          },
          saves: {
            where: { userId },
            select: { userId: true },
          },
        }),
      },
    });
  
    const result = posts.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        createdAt: post.createdAt,
        estimatedReadTime: post.estimatedReadTime,
        author: post.author,
        isUpvoted: userId ? post.upvotes?.length > 0 : false,
        isSaved: userId ? post.saves?.length > 0 : false,
      }));
  
    return APIResponse.success(res, '', result);
});
  

export const getPostDetailsById = asyncWrapper(async (req: Request, res: Response) => {
    const postId = req.params.id;

    const userId = extractUserIdFromRequest(req);

    const findPost = prisma.post.findUnique({
        where: { id: postId },
        select: {
            id: true,
            title: true,
            description: true,
            content: true,
            authorId: true,
            createdAt: true,
            stats: true,
        }
    });

    const findUpvote = userId
    ? prisma.upvote.findUnique({
          where: {
              userId_postId: {
                  userId,
                  postId,
              }
          },
          select: { userId: true }
      })
    : Promise.resolve(null);

    const [post, upvoted] = await Promise.all([findPost, findUpvote]);

    const resData = {
        post,
        isUpvoted: !!upvoted 
    };

    APIResponse.success(res, '', resData);

    if(userId && userId !== post?.authorId){
        await prisma.postStats.upsert({
            where: { postId },
            update: {
              views: { increment: 1 },
            },
            create: {
              postId,
              views: 1,
            },
          }).catch(err => console.log(err))
        }
});

export const getSavedPosts = asyncWrapper( async(req: Request, res: Response) => {
    const post = await prisma.save.findMany({
        where: { userId: req.user?.userId },
        include: {
            post: true
        }
    })
    return APIResponse.success(res, '', post)
})

export const upvotePost = asyncWrapper(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const postId = req.params.id;
  
    try {
      const [upvote, updatedStats] = await prisma.$transaction([
        prisma.upvote.create({
          data: { userId, postId },
        }),
  
        prisma.postStats.upsert({
            where: { postId },
            update: {
              upvotes: { increment: 1 },
            },
            create: {
              postId,
              upvotes: 1,
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
  console.log('IN');
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
        console.log('ERROR');
      if (err.code === 'P2025') {
        console.log('PRISMA');
        throw APIError.badRequest('You have not upvoted this post');
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
        throw APIError.badRequest('You have already saved this post');
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
        throw APIError.badRequest('You have not saved this post');
      }
      throw err;
    }
});

//LEADERBOARD
type Filter     = 'views' | 'upvotes';
type TimeFrame  = 'day' | 'week' | 'month' | 'all'

export const getLeaderboard = asyncWrapper(async (req: Request, res: Response) => {

    const filter     = (req.query.filter   as string) ?? 'upvotes';
    const timeFrame  = (req.query.timeFrame as string) ?? 'all';
    const pageNum    = Math.max(1, parseInt((req.query.page   as string) ?? '1',  10));
    const limitNum   = Math.max(1, parseInt((req.query.limit  as string) ?? '10', 10));
    const skip       = (pageNum - 1) * limitNum;
  
    if (!['views','upvotes'].includes(filter)) 
      throw APIError.badRequest(`Invalid filter: ${filter}`);
    if (!['day','week','month','all'].includes(timeFrame)) 
      throw APIError.badRequest(`Invalid timeFrame: ${timeFrame}`);
  
    const where: any = {};
    if (timeFrame !== 'all') {
      const now = Date.now();
      const msInDay = 24*60*60*1000;
      const start = new Date(
        now - (
          timeFrame === 'day'   ? msInDay :
          timeFrame === 'week'  ? 7*msInDay :
                                  30*msInDay
        )
      );
      where.createdAt = { gte: start };
    }
  
    const total = await prisma.post.count({ where });
  
    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        stats: {
          select: { views: true, upvotes: true }
        }
      },
      orderBy: { stats: { [filter as Filter]: 'desc' } },
      skip,
      take: limitNum
    });
  
    const totalPages = Math.ceil(total / limitNum);
    return APIResponse.success(res, 'Leaderboard fetched', {
      posts,
      pagination: { total, page: pageNum, limit: limitNum, totalPages }
    });
});