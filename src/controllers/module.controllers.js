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
            }
        });
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
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
        
    } catch (error) {
        
    }
}

export {addModule, addLesson};