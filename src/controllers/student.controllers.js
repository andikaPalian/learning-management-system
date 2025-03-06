import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const registerStudent = async (req, res) => {
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

        const studentExist = await prisma.user.findUnique({
            where: {
                email: email,
                role: 'STUDENT'
            }
        });
        if (studentExist) {
            return res.status(400).json({
                message: "Student already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const student = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
                role: 'STUDENT'
            }
        });

        res.status(201).json({
            message: "Student registered successfully",
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                role: student.role
            }
        });
    } catch (error) {
        console.error("Error during student registration:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const loginStudent = async (req, res) => {
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

        const student = await prisma.user.findUnique({
            where: {
                email: email,
                role: 'STUDENT'
            }
        });
        if (!student) {
            return res.status(404).json({
                message: "Student doesn't exist"
            });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (isMatch) {
            const token = jwt.sign({
                id: student.id,
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            student.password = undefined;
            return res.status(200).json({
                message: "Student logged in successfully",
                student: {
                    name: student.name,
                    email: student.email,
                    role: student.role,
                    token: token
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.error("Error during student login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const updateProfile = async (req, res) => {
    try {
        const {name, email} = req.body;

        const student = await prisma.user.findUnique({
            where: {
                id: req.user.id,
                email: req.user.email,
                role: 'STUDENT'
            }
        });
        if (!student) {
            return res.status(404).json({
                message: "Student doesn't exist"
            });
        }

        if (student.id !== req.user.id) {
            return res.status(401).json({
                message: "Unauthorized: You can only update your own profile"
            });
        }

        const updateData = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !validator.isLength(name, {min: 3, max: 30})) {
                return res.status(400).json({
                    message: "Name must be a string and between 3 and 30 characters"
                });
            }
            updateData.name = name;
        }

        if (email !== undefined) {
            if (typeof email !== 'string' || !validator.isEmail(email)) {
                return res.status(400).json({
                    message: "Email must be a valid email"
                });
            }

            if (student.email === email) {
                return res.status(400).json({
                    message: "Email is the same as the current one"
                });
            }
            updateData.email = email;
        }

        const updatedStudent = await prisma.user.update({
            where: {
                id: req.user.id,
                email: req.user.email,
                role: 'STUDENT'
            },
            data: updateData
        });

        res.status(200).json({
            message: "Profile updated successfully",
            student: {
                id: updatedStudent.id,
                name: updatedStudent.name,
                email: updatedStudent.email,
                role: updatedStudent.role
            }
        });
    } catch (error) {
        console.error("Error during student profile update:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {registerStudent, loginStudent, updateProfile};