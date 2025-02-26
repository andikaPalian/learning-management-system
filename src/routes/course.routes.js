import express from 'express';
import { createCourse, deleteCourse, listCourses, updateCourse } from '../controllers/course.controllers.js';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';

const courseRouter = express.Router();

// Protected routes
courseRouter.post("/create", auth, hashRole(['INSTRUCTOR']), createCourse);
courseRouter.patch("/edit/:courseId", auth, hashRole(['INSTRUCTOR']), updateCourse);
courseRouter.delete("/delete/:courseId", auth, hashRole(['INSTRUCTOR']), deleteCourse);

// Public routes
courseRouter.get("/list", listCourses);

export default courseRouter;