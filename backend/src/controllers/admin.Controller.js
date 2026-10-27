import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { Role } from "../utils/enums.js";

export async function createStaff(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),  
      email: z.string().trim().email().max(254), 
      employeeId: z.string().trim().min(1).max(50),
      password: z.string().min(8).max(72)
    });

    const parsed = schema.safeParse(req.body); //safeParse returns an object with success and data or error properties

    if (!parsed.success) {  
      return res.status(400).json({
        message: "Invalid staff details.",
        errors: parsed.error.issues
      });
    }

    const { name, employeeId, password } = parsed.data; //parsed.data contains the validated data from the request body
    const email = parsed.data.email.toLowerCase();    // Convert email to lowercase for consistency

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ //409 Conflict status code indicates that the request could not be completed due to a conflict with the current state of the resource
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);// Hash the original password using bcrypt with a salt round of 12

    const user = await User.create({ //creating a user object
      name,
      email,
      employeeId,
      password: passwordHash,
      role: Role.MESS_STAFF,
      isActive: true
    });

    return res.status(201).json({  //201 Created status code indicates that the request has been fulfilled and has resulted in the creation of a new resource
      message: "Mess staff account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) { //11000 is the error code for duplicate key error in MongoDB, which occurs when trying to create a user with an email that already exists in the database
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    next(error);
  } 
}