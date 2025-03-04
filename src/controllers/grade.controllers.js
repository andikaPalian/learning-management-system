import { PrismaClient } from "@prisma/client";
import validator from 'validator';

const prisma = new PrismaClient();

const giveGrade = async (req, res) => {
    try {
        const {submissionId} = req.params;
        const {score, feedback} = req.body;

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
                message: "Unauthorized: You are not allowed to access this resource. Only the instructor of the course can give grades."
            });
        }

        if (typeof score !== 'number' || !validator.isInt(score.toString(), {min: 0, max: 100})) {
            return res.status(400).json({
                message: "Grade must be a number between 0 and 100"
            });
        }

        if (typeof feedback !== 'string' || !validator.isLength(feedback, {min: 3, max: 1000})) {
            return res.status(400).json({
                message: "Feedback must be a string between 3 and 1000 characters"
            });
        }

        const updateGrade = await prisma.grade.upsert({
            where: {
                submissionId: submissionId
            },
            update: {
                score: score,
                feedback: feedback
            },
            create: {
                score: score,
                feedback: feedback,
                submission: {
                    connect: {
                        id: submissionId
                    }
                }
            }
        });

        res.status(200).json({
            message: "Grade given successfully",
            grade: {
                id: updateGrade.id,
                score: updateGrade.score,
                feedback: updateGrade.feedback,
                submissionId: updateGrade.submissionId,
                createdAt: updateGrade.createdAt,
                updatedAt: updateGrade.updatedAt
            }
        });
    } catch (error) {
        console.error("Error during give grade:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const getGrade = async (req, res) => {
    try {
        const {submissionId} = req.params;

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
                grade: true
            }
        });
        if (!submission) {
            return res.status(404).json({
                message: "Submission not found"
            });
        }

        if (submission.studentId === req.user.id) {
            if (submission.grade) {
                return res.status(200).json({
                    grade: {
                        score: submission.grade.score,
                        feedback: submission.grade.feedback
                    }
                });
            } else {
                return res.status(200).json({
                    message: "This submission has not been graded yet."
                });
            }
        } else {
            return res.status(403).json({
                message: "Unauthorized: You are not allowed to access this resource. Only the student who submitted the assignment can view the grade."
            });
        }
    } catch (error) {
        console.error("Error during get grade:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {giveGrade, getGrade};