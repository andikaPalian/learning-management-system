import express from 'express';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';
import { commentSubmmision, listSubmissions, submitSubmission } from '../controllers/submission.controllers.js';
import { getGrade, giveGrade } from '../controllers/grade.controllers.js';

const submissionRouter = express.Router();

// Student Routes
submissionRouter.post("/submission/:assigmentId", auth, hashRole(["STUDENT"]), submitSubmission);
submissionRouter.get("/submission/:submissionId/grade", auth, hashRole(["STUDENT"]), getGrade);

// Instrructor Routes
submissionRouter.get("/submissions/:assigmentId", auth, hashRole(["INSTRUCTOR"]), listSubmissions);
submissionRouter.patch("/submission/:submissionId/comment", auth, hashRole(["INSTRUCTOR"]), commentSubmmision);
submissionRouter.post("/submission/:submissionId/grade", auth, hashRole(["INSTRUCTOR"]), giveGrade);

export default submissionRouter;