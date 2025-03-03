import { PrismaClient } from '@prisma/client';
import validator from 'validator';

const prisma = new PrismaClient();

const submitSubmission = async (req, res) => {
    try {
        const studentId = req.user.id;
        const {assigmentId} = req.params;
        const {content} = req.body;
        
        if (!validator.isUUID(assigmentId)) {
            return res.status(400).json({
                message: "Invalid assigment id format"
            });
        }

        const assigment = await prisma.assigment.findUnique({
            where: {
                id: assigmentId
            },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });
        if (!assigment) {
            return res.status(404).json({
                message: "Assigment not found"
            });
        }

        if (typeof content !== 'string' || !validator.isLength(content, {min: 10, max: 1000})) {
            return res.status(400).json({
                message: "Content must be a string between 10 and 1000 characters"
            });
        }

        const courseId = assigment.module.courseId;

        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId: studentId,
                courseId: courseId
            }
        });
        if (!enrollment) {
            return res.status(403).json({
                message: "Unauthorized: Student is not enrolled in the course"
            });
        }

        const submission = await prisma.submission.create({
            data: {
                content,
                studentId: studentId,
                assigmentId: assigmentId
            }
        });

        res.status(201).json({
            message: "Submission created successfully",
            submission: {
                id: submission.id,
                content: submission.content,
                studentId: submission.studentId,
                assigmentId: submission.assigmentId
            }
        });
    } catch (error) {
        console.error("Error during submit submission:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const listSubmissions = async (req, res) => {
    try {
        const {assigmentId} = req.params;
        const {page = 1, limit = 10} = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        if (!validator.isUUID(assigmentId)) {
            return res.status(400).json({
                message: "Invalid assigment id format"
            });
        }

        const assigment = await prisma.assigment.findUnique({
            where: {
                id: assigmentId
            },
            include: {
                module: {
                    include: {
                        course: true
                    }
                }
            }
        });
        if (!assigment) {
            return res.status(404).json({
                message: "Assigment not found"
            });
        }

        if (assigment.module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Forbidden: You are not allowed to access this resource"
            });
        }

        const submissions = await prisma.submission.findMany({
            where: {
                assigmentId: assigmentId
            },
            skip,
            take: limitNum,
            orderBy: {
                submittedAt: 'desc'
            }
        });
        
        const totalSubmissions = await prisma.submission.count({
            where: {
                assigmentId: assigmentId
            }
        });

        res.status(200).json({
            message: "Submissions retrieved successfully",
            data: {
                submissions: submissions.map(submission => ({
                    id: submission.id,
                    content: submission.content,
                    studentId: submission.studentId,
                    submittedAt: submission.submittedAt,
                    comment: submission.instructorComment
                })),
                totalSubmissions: totalSubmissions,
                totalPages: Math.ceil(totalSubmissions / limitNum),
                currentPage: pageNum,
                perPage: limitNum
            }
        });
    } catch (error) {
        console.error("Error during list submissions:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const commentSubmmision = async (req, res) => {
    try {
        const {submissionId} = req.params;
        const {comment} = req.body;

        if (!validator.isUUID(submissionId)) {
            return res.status(400).json({
                message: "Invalid submission id format"
            });
        }

        const submission = await prisma.submission.findUnique({
            where: {
                id: submissionId
            },
            include: {
                assigment: {
                    include: {
                        module: {
                            include: {
                                course: true
                            }
                        }
                    }
                }
            }
        });
        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        if (submission.assigment.module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: You are not allowed to access this resource. Only the instructor of the course can comment on submissions."
            });
        }

        if (typeof comment !== 'string' || !validator.isLength(comment, {min: 10, max: 1000})) {
            return res.status(400).json({
                message: "Comment must be a string between 10 and 1000 characters"
            });
        }

        const updatedSubmission = await prisma.submission.update({
            where: {
                id: submissionId
            },
            data: {
                instructorComment: comment
            }
        });

        res.status(200).json({
            message: "Submission commented successfully",
            submission: updatedSubmission
        });
    } catch (error) {
        console.error("Error during comment submission:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {submitSubmission, listSubmissions, commentSubmmision};