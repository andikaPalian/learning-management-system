import express from 'express';
import { loginInstructor, registerInstructor, updateProfile } from '../controllers/instructor.controllers.js';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';

const instructorRouter = express.Router();

// Public routes
instructorRouter.post("/register", registerInstructor);
instructorRouter.post("/login", loginInstructor);

// Protected routes
instructorRouter.patch("/edit", auth, hashRole(['INSTRUCTOR']), updateProfile);

export default instructorRouter;