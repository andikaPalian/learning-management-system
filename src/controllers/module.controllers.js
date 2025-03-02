import { PrismaClient } from '@prisma/client';
import validator from 'validator';

const prisma = new PrismaClient();

const addModule = async (req, res) => {
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
            }
        });
        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        if (!title?.trim()) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        if (typeof title !== 'string' || !validator.isLength(title, {min: 3, max: 255})) {
            return res.status(400).json({
                message: "Title must be a string between 3 and 255 characters"
            });
        }

        if (course.instructorId  !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can add modules"
            });
        }

        const module = await prisma.module.create({
            data: {
                title,
                courseId
            }
        });

        res.status(201).json({
            message: "Module created successfully",
            module: module
        });
    } catch (error) {
        console.error("Error during add module:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const addLesson = async (req, res) => {
    try {
        const {moduleId} = req.params;
        const {title, content} = req.body;

        if (!validator.isUUID(moduleId)) {
            return res.status(400).json({
                message: "Invalid module id format"
            });
        }

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        if (typeof title !== 'string' || !validator.isLength(title, {min: 3, max: 255})) {
            return res.status(400).json({
                message: "Title must be a string between 3 and 255 characters"
            });
        }

        if (typeof content !== 'string' || !validator.isLength(content, {min: 3})) {
            return res.status(400).json({
                message: "Content must be a string with at least 3 characters"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId
            },
            include: {
                course: true
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        if (module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can add lessons"
            });
        }

        const lesson = await prisma.lesson.create({
            data: {
                title,
                content,
                moduleId
            }
        });

        res.status(201).json({
            message: "Lesson created successfully",
            lesson: lesson
        });
    } catch (error) {
        console.error("Error during add lesson:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const listModule = async (req, res) => {
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

        const modules = await prisma.module.findMany({
            where: {
                courseId: courseId
            },
            include: {
                lessons: true
            },
            skip: skip,
            take: limitNum
        });

        const totalModules = await prisma.module.count({
            where: {
                courseId: courseId
            }
        });

        const totalStudents = await prisma.enrollment.count({
            where: {
                courseId: courseId
            }
        });

        res.status(200).json({
            message: "Modules retrieved successfully",
            data: {
                course: {
                    title: course.title,
                    description: course.description,
                    totalStudents: totalStudents
                },
                modules: modules.map(module => ({
                    id: module.id,
                    title: module.title,
                    lessons: module.lessons.map(lesson => ({
                        id: lesson.id,
                        title: lesson.title,
                        content: lesson.content
                    }))
                })),
                totalModules: totalModules,
                totalPages: Math.ceil(totalModules / limitNum),
                currentPage: pageNum,
                perPage: limitNum
            }
        });
    } catch (error) {
        console.error("Error during list modules:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const editModule = async (req, res) => {
    try {
        const {moduleId} = req.params;
        const {title} = req.body;

        if (!validator.isUUID(moduleId)) {
            return res.status(400).json({
                message: "Invalid module id format"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId
            },
            include: {
                course: true
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        if (module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can edit modules"
            });
        }

        const updateMData = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !validator.isLength(title, {min: 3, max: 100})) {
                return res.status(400).json({
                    message: "Title must be a string and between 3 and 100 characters"
                });
            }
            updateMData.title = title;
        }

        const updateModule = await prisma.module.update({
            where: {
                id: moduleId
            },
            data: updateMData,
            include: {
                course: true
            }
        });

        res.status(200).json({
            message: "Module updated successfully",
            module: updateModule
        });
    } catch (error) {
        console.error("Error during edit module:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const editLesson = async (req, res) => {
    try {
        const {moduleId, lessonId} = req.params;
        const {title, content} = req.body;

        if (!validator.isUUID(moduleId) || !validator.isUUID(lessonId)) {
            return res.status(400).json({
                message: "Invalid module or lesson id format"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId,
            },
            include: {
                course: true
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: lessonId,
                moduleId: moduleId
            },
            include: {
                module: true
            }
        });
        if (!lesson) {
            return res.status(404).json({
                message: "Lesson not found"
            });
        }

        if (module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can edit lessons"
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

        if (content !== undefined) {
            if (typeof content !== "string" || !validator.isLength(content, {min: 3, max: 1000})) {
                return res.status(400).json({
                    message: "Content must be a string and between 3 and 1000 characters"
                });
            }
            updateData.content = content;
        }

        const updateLesson = await prisma.lesson.update({
            where: {
                id: lessonId,
                moduleId: moduleId
            },
            data: updateData,
            include: {
                module: true
            }
        });

        res.status(200).json({
            message: "Lesson updated successfully",
            lesson: updateLesson
        });
    } catch (error) {
        console.error("Error during edit lesson:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const deleteModule = async (req, res) => {
    try {
        const {moduleId} = req.params;

        if (!validator.isUUID(moduleId)) {
            return res.status(400).json({
                message: "Invalid module id format"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId
            },
            include: {
                course: true,
                lessons: true
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        if (module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can delete modules"
            });
        }

        if (module.lessons.length > 0) {
            return res.status(400).json({
                message: "Cannot delete a module with lessons"
            });
        }

        await prisma.module.delete({
            where: {
                id: moduleId
            }
        });

        res.status(200).json({
            message: "Module deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete module:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

const deleteLesson = async (req, res) => {
    try {
        const {moduleId, lessonId} = req.params;
        
        if (!validator.isUUID(moduleId) || !validator.isUUID(lessonId)) {
            return res.status(400).json({
                message: "Invalid module or lesson id format"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId,
            },
            include: {
                course: true
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: lessonId,
                moduleId: moduleId
            }
        });
        if (!lesson) {
            return res.status(404).json({
                message: "Lesson not found"
            });
        }

        if (module.course.instructorId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized: Only the course instructor can delete lessons"
            });
        }

        await prisma.lesson.delete({
            where: {
                id: lessonId,
                moduleId: moduleId
            }
        });

        res.status(200).json({
            message: "Lesson deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete lesson:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    }
}

export {addModule, addLesson, listModule, editModule, editLesson, deleteModule, deleteLesson};