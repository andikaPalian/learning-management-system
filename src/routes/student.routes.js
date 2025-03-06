import express from "express";
import { loginStudent, registerStudent, updateProfile } from "../controllers/student.controllers.js";
import { auth, hashRole } from "../middlewares/authMiddlewares.js";

const studentRouter = express.Router();

// Public routes
studentRouter.post("/register", registerStudent);
studentRouter.post("/login", loginStudent);

// Protected routes
studentRouter.patch("/edit", auth, hashRole(['STUDENT']), updateProfile);

export default studentRouter;