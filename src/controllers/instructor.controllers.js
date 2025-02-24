import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const registerInstructor = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (typeof name !== 'string' || !validator.isLength(name, {min: 3, max: 30})) {
            return res.status(400).json({
                message: "Name must be a string and between 3 and 30 characters"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
            });
        }

        const instructorExist = await prisma.user.findUnique({
            where: {
                email: email,
                role: 'INSTRUCTOR'
            }
        });
        if (instructorExist) {
            return res.status(400).json({
                message: "Instructor already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const instructor = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
                role: 'INSTRUCTOR'
            }
        });

        res.status(201).json({
            message: "Instructor created successfully",
            instructor: {
                id: instructor.id,
                name: instructor.name,
                email: instructor.email,
                role: instructor.role
            }
        });
    } catch (error) {
        console.error("Error during instructor registration:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const loginInstructor = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "Please fill all the fields"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        const instructor = await prisma.user.findUnique({
            where: {
                email: email,
                role: 'INSTRUCTOR'
            }
        });
        if (!instructor) {
            return res.status(404).json({
                message: "Instructor doesn't exist"
            });
        }

        const isMatch = await bcrypt.compare(password, instructor.password);
        if (isMatch) {
            const token = jwt.sign({
                id: instructor.id
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            instructor.password = undefined;
            return res.status(200).json({
                message: "Instructor logged in successfully",
                instructor: {
                    name: instructor.name,
                    email: instructor.email,
                    role: instructor.role,
                    token: token
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.error("Error during instructor login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {registerInstructor, loginInstructor};