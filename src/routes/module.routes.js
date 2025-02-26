import express from 'express';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';
import { addLesson, addModule } from '../controllers/module.controllers.js';

const moduleRouter =  express.Router();

moduleRouter.post("/:courseId", auth, hashRole(["INSTRUCTOR"]), addModule);
moduleRouter.post("/:moduleId/lesson", auth, hashRole(["INSTRUCTOR"]), addLesson);

export default moduleRouter;