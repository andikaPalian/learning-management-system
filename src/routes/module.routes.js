import express from 'express';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';
import { addAssigment, addLesson, addModule, deleteAssigment, deleteLesson, deleteModule, editAssigment, editLesson, editModule, listModule } from '../controllers/module.controllers.js';

const moduleRouter =  express.Router();

// Protected routes
moduleRouter.post("/:courseId", auth, hashRole(["INSTRUCTOR"]), addModule);
moduleRouter.post("/:moduleId/lesson", auth, hashRole(["INSTRUCTOR"]), addLesson);
moduleRouter.patch("/:moduleId/edit", auth, hashRole(["INSTRUCTOR"]), editModule);
moduleRouter.patch("/:moduleId/:lessonId/edit", auth, hashRole(["INSTRUCTOR"]), editLesson);
moduleRouter.delete("/:moduleId/delete", auth, hashRole(["INSTRUCTOR"]), deleteModule);
moduleRouter.delete("/:moduleId/:lessonId/delete", auth, hashRole(["INSTRUCTOR"]), deleteLesson);
moduleRouter.post("/:moduleId/assigment", auth, hashRole(["INSTRUCTOR"]), addAssigment);
moduleRouter.patch("/:moduleId/assigment/:assigmentId/edit", auth, hashRole(["INSTRUCTOR"]), editAssigment);
moduleRouter.delete("/:moduleId/assigment/:assigmentId", auth, hashRole(["INSTRUCTOR"]), deleteAssigment);

// Public routes
moduleRouter.get("/:courseId", listModule);

export default moduleRouter;