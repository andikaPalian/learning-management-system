import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import adminRouter from './src/routes/admin.routes.js';
import instructorRouter from './src/routes/instructor.routes.js';
import studentRouter from './src/routes/student.routes.js';
import courseRouter from './src/routes/course.routes.js';
import moduleRouter from './src/routes/module.routes.js';

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRouter);
app.use("/api/instructor", instructorRouter);
app.use("/api/student", studentRouter);
app.use("/api/course", courseRouter);
app.use("/api/module", moduleRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});