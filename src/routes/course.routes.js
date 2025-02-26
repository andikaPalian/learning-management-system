import express from 'express';
import { createCourse, deleteCourse, joinCourse, listCourses, listStudents, updateCourse } from '../controllers/course.controllers.js';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';

const courseRouter = express.Router();

// Protected routes
courseRouter.post("/create", auth, hashRole(['INSTRUCTOR']), createCourse);
courseRouter.patch("/edit/:courseId", auth, hashRole(['INSTRUCTOR']), updateCourse);
courseRouter.delete("/delete/:courseId", auth, hashRole(['INSTRUCTOR']), deleteCourse);
courseRouter.post("/join/:courseId", auth, hashRole(['STUDENT']), joinCourse);
courseRouter.get("/list/students/:courseId", auth, hashRole(['INSTRUCTOR']), listStudents);

// Public routes
courseRouter.get("/list", listCourses);

export default courseRouter;