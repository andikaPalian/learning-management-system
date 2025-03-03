import express from 'express';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';
import { commentSubmmision, listSubmissions, submitSubmission } from '../controllers/submission.controllers.js';

const submissionRouter = express.Router();

// Student Routes
submissionRouter.post("/submission/:assigmentId", auth, hashRole(["STUDENT"]), submitSubmission);

// Instrructor Routes
submissionRouter.get("/submissions/:assigmentId", auth, hashRole(["INSTRUCTOR"]), listSubmissions);
submissionRouter.patch("/submission/:submissionId/comment", auth, hashRole(["INSTRUCTOR"]), commentSubmmision);

export default submissionRouter;