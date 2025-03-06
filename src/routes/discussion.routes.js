import express from 'express';
import { addComment, createDiscussion, deleteComment, listDiscussions } from '../controllers/discussion.controllers.js';
import { auth, hashRole } from '../middlewares/authMiddlewares.js';

const discussionRouter = express.Router();

discussionRouter.post("/discussion/:courseId", auth, hashRole(["INSTRUCTOR", "STUDENT"]), createDiscussion);
discussionRouter.post("/:courseId/:discussionId/comment", auth, hashRole(["INSTRUCTOR", "STUDENT"]), addComment);
discussionRouter.get("/:courseId", auth, hashRole(["INSTRUCTOR", "STUDENT"]), listDiscussions);
discussionRouter.delete("/:commentId", auth, hashRole(["INSTRUCTOR", "STUDENT"]), deleteComment);

export default discussionRouter;