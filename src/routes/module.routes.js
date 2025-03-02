import express from 'express';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';
import { addLesson, addModule, deleteLesson, deleteModule, editLesson, editModule, listModule } from '../controllers/module.controllers.js';

const moduleRouter =  express.Router();

// Protected routes
moduleRouter.post("/:courseId", auth, hashRole(["INSTRUCTOR"]), addModule);
moduleRouter.post("/:moduleId/lesson", auth, hashRole(["INSTRUCTOR"]), addLesson);
moduleRouter.patch("/:moduleId/edit", auth, hashRole(["INSTRUCTOR"]), editModule);
moduleRouter.patch("/:moduleId/:lessonId/edit", auth, hashRole(["INSTRUCTOR"]), editLesson);
moduleRouter.delete("/:moduleId/delete", auth, hashRole(["INSTRUCTOR"]), deleteModule);
moduleRouter.delete("/:moduleId/:lessonId/delete", auth, hashRole(["INSTRUCTOR"]), deleteLesson);

// Public routes
moduleRouter.get("/:courseId", listModule);

export default moduleRouter;