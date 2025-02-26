import { PrismaClient } from '@prisma/client';
import validator from 'validator';

const prisma = new PrismaClient();

const createCourse = async (req, res) => {
    try {
        const {title, description} = req.body;
        if (!title?.trim() || !description?.trim()) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (typeof title !== 'string' || !validator.isLength(title, {min: 3, max: 100})) {
            return res.status(400).json({
                message: "Title must be a string and between 3 and 100 characters"
            });
        }

        if (typeof description !== 'string' || !validator.isLength(description, {min: 3, max: 300})) {
            return res.status(400).json({
                message: "Description must be a string and between 3 and 300 characters"
            });
        }

        const instructor = await prisma.user.findUnique({
            where: {
                id: req.user.id,
                role: 'INSTRUCTOR'
            }
        });
        if (!instructor) {
            return res.status(400).json({
                message: "You are not an instructor"
            });
        }

        const course = await prisma.course.create({
            data: {
                title,
                description,
                instructorId: req.user.id
            },
            
        });

        res.status(201).json({
            message: "Course created successfully",
            course: {
                id: course.id,
                title: course.title,
                description: course.description,
                instructor: {
                    id: course.instructorId,
                    name: instructor.name
                }
            }
        });
    } catch (error) {
        console.error("Error during create course:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const listCourses = async (req, res) => {
    try {
        const {search, page = 1, limit = 10} = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalCourses = await prisma.course.count({
            where: {
                title: {
                    contains: search || "",
                    mode: "insensitive"
                }
            }
        });
        
        const courses = await prisma.course.findMany({
            where: {
                title: {
                    contains: search || "",
                    mode: "insensitive"
                }
            },
            include: {
                modules: true
            },
            skip: skip,
            take: limitNum
        });

        // const totalEnrollments = courses.reduce((acc, course) => {
        //     return acc + course.enrollments.length;
        // }, 0);

        const totalEnrollments = await prisma.enrollment.count({
            where: {
                course: {
                    title: {
                        contains: search || "",
                        mode: "insensitive"
                    }
                }
            }
        });

        res.status(200).json({
            message: "Courses fetched successfully",
            courses: {
                courses,
                totalStudent: totalEnrollments
            },
            totalCourses: totalCourses,
            totalPages: Math.ceil(totalCourses / limitNum),
            currentPage: pageNum,
            perPage: limitNum,
        });
    } catch (error) {
        console.error("Error during get courses:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const updateCourse = async (req, res) => {
    try {
        const {courseId} = req.params;
        const {title, description} = req.body;

        if (!courseId) {
            return res.status(400).json({
                message: "Course id is required"
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

        const updateData = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !validator.isLength(title, {min: 3, max: 100})) {
                return res.status(400).json({
                    message: "Title must be a string and between 3 and 100 characters"
                });
            }
            updateData.title = title;
        }

        if (description !== undefined) {
            if (typeof description !== "string" || !validator.isLength(description, {min: 3, max: 300})) {
                return res.status(400).json({
                    message: "Description must be a string and between 3 and 300 characters"
                });
            }
            updateData.description = description;
        }

        const updateCourse = await prisma.course.update({
            where: {
                id: courseId
            },
            data: updateData,
            include: {
                modules: true
            }
        });

        res.status(200).json({
            message: "Course updated successfully",
            course: updateCourse
        });
    } catch (error) {
        console.error("Error during update course:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deleteCourse = async (req, res) => {
    try {
        const {courseId} = req.params;

        if (!courseId) {
            return res.status(400).json({
                message: "Course id is required"
            });
        }

        await prisma.course.delete({
            where: {
                id: courseId
            }
        });
        
        res.status(200).json({
            message: "Course deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete course:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const joinCourse = async (req, res) => {
    try {
        const {courseId} = req.params;

        if (!courseId) {
            return res.status(400).json({
                message: "Course id is required"
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

        const enrollment = await prisma.enrollment.findFirst({
            where: {
                courseId: courseId,
                userId: req.user.id
            }
        });
        if (enrollment) {
            return res.status(400).json({
                message: "You are already enrolled in this course"
            });
        }

        await prisma.enrollment.create({
            data: {
                courseId: courseId,
                userId: req.user.id
            }
        });

        res.status(200).json({
            message: "You have successfully enrolled in this course"
        });
    } catch (error) {
        console.error("Error during join course:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const listStudents = async (req, res) => {
    try {
        const {courseId} = req.params;
        const {page = 1, limit = 10} = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        if (!courseId) {
            return res.status(400).json({
                message: "Course id is required"
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

        const students = await prisma.enrollment.findMany({
            where: {
                courseId: courseId
            },
            include: {
                user: true
            },
            skip: skip,
            take: limitNum
        });

        const totalStudents = await prisma.enrollment.count({
            where: {
                courseId: courseId
            }
        });

        res.status(200).json({
            message: "Students fetched successfully",
            data: {
                course: course.title,
                students: students.map(student => ({
                id: student.user.id,
                name: student.user.name,
                email: student.user.email
                })),
                totalStudents: totalStudents,
                totalPages: Math.ceil(totalStudents / limitNum),
                currentPage: pageNum,
                perPage: limitNum
            }
        });
    } catch (error) {
        console.error("Error during list students:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {createCourse, listCourses, updateCourse, deleteCourse, joinCourse, listStudents};