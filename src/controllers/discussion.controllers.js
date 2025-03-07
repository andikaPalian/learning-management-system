import { PrismaClient } from "@prisma/client";
import validator from 'validator';

const prisma = new PrismaClient();

const createDiscussion = async (req, res) => {
    try {
        const {courseId} = req.params;
        const {title} = req.body;

        if (!validator.isUUID(courseId)) {
            return res.status(400).json({
                message: "Invalid course id format"
            });
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId
            },
            include: {
                enrollments: true,
            }
        });
        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        if (typeof title !== 'string' || !validator.isLength(title, {min: 10, max: 100})) {
            return res.status(400).json({
                message: "Title must be a string between 10 and 100 characters"
            });
        }

        const isInstructor = course.instructorId === req.user.id;
        const isEnrolledStudent = course.enrollments.some(enrollment => enrollment.userId === req.user.id)
        
        if (!isInstructor && !isEnrolledStudent) {
            return res.status(403).json({
                message: "Unauthorized: You are not allowed to access this resource. Only the instructor of the course or enrolled students can create discussions."
            });
        }
        const discussion = await prisma.discussion.create({
            data: {
                title,
                courseId,
                userId: req.user.id
            },
            include: {
                user: true
            }
        });

        res.status(201).json({
            message: "Discussion created successfully",
            discussion: {
                id: discussion.id,
                name: discussion.user.name,
                title: discussion.title,
                createdAt: discussion.createdAt,
            }
        });
    } catch (error) {
        console.error("Error during create discussion:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const addComment = async (req, res) => {
    try {
        const {courseId, discussionId} = req.params;
        const {content} = req.body;

        if (!validator.isUUID(courseId) || !validator.isUUID(discussionId)) {
            return res.status(400).json({
                message: "Invalid course or discussion id format"
            });
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId
            },
            include: {
                enrollments: true
            }
        });
        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        const discussion = await prisma.discussion.findUnique({
            where: {
                id: discussionId
            },
            include: {
                comments: {
                    include: {
                        user: true
                    }
                }
            }
        });
        if (!discussion) {
            return res.status(404).json({
                message: "Discussion not found"
            });
        }

        if (typeof content !== 'string' || !validator.isLength(content, {min: 2, max: 1000})) {
            return res.status(400).json({
                message: "Comment must be a string between 2 and 1000 characters"
            });
        }

        const isInstructor = course.instructorId === req.user.id;
        const isEnrolledStudent = course.enrollments.some(enrollment => enrollment.userId === req.user.id);

        if (!isInstructor && !isEnrolledStudent) {
            return res.status(403).json({
                message: "Unauthorized: You are not allowed to access this resource. Only the instructor of the course or enrolled students can add comments."
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                discussions: {
                    connect: {
                        id: discussionId
                    }
                },
                user: {
                    connect: {
                        id: req.user.id
                    }
                }
            }
        });

        res.status(201).json({
            message: "Comment added successfully",
            comment: {
                id: comment.id,
                username: discussion.comments.find(comment => comment.id === comment.id).user.name,
                content: comment.content,
                discussionId: comment.discussionId,
                createdAt: comment.createdAt,
            }
        });
    } catch (error) {
        console.error("Error during add comment:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const listDiscussions = async (req, res) => {
    try {
        const {courseId} = req.params;
        const {page = 1, limit = 10} = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        if (!validator.isUUID(courseId)) {
            return res.status(400).json({
                message: "Invalid course id format"
            });
        }

        const course = await prisma.course.findUnique({
            where: {
                id: courseId
            }
        });
        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        const discussions = await prisma.discussion.findMany({
            where: {
                courseId: courseId
            },
            include: {
                comments: {
                    include: {
                        user: true
                    }
                },
                user: true
            },
            skip: skip,
            take: limitNum
        });
        if (!discussions) {
            return res.status(404).json({
                message: "No discussions found"
            });
        }

        const totalDiscussions = await prisma.discussion.count({
            where: {
                courseId: courseId
            }
        });

        res.status(200).json({
            message: "Discussions retrieved successfully",
            discussions: discussions.map(discussion => ({
                id: discussion.id,
                user: discussion.user.name,
                title: discussion.title,
                content: discussion.content,
                createdAt: discussion.createdAt,
                comments: discussion.comments.map(comment => ({
                    id: comment.id,
                    user: comment.user.name,
                    content: comment.content,
                    createdAt: comment.createdAt,
                }))
            })),
            totalDiscussions: totalDiscussions,
            totalPage: Math.ceil(totalDiscussions / limitNum),
            page: pageNum,
            perPage: limitNum
        });
    } catch (error) {
        console.error("Error during list discussions:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const deleteComment = async (req, res) => {
    try {
        const {commentId} = req.params;

        if (!validator.isUUID(commentId)) {
            return res.status(400).json({
                message: "Invalid comment id format"
            });
        }

        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId
            }
        });
        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: You are not allowed to delete this comment. Only the user who created the comment can delete it."
            });
        }

        await prisma.comment.delete({
            where: {
                id: commentId
            }
        });

        res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete comment:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {createDiscussion, addComment, listDiscussions, deleteComment};