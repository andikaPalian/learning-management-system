import express from 'express';
import { loginInstructor, registerInstructor } from '../controllers/instructor.controllers.js';

const instructorRouter = express.Router();

instructorRouter.post("/register", registerInstructor);
instructorRouter.post("/login", loginInstructor);

export default instructorRouter;