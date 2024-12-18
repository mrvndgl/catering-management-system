import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import { auth, adminAuth, staffAuth } from "../middleware/auth.js";

const employeeRouter = express.Router();

// Admin registration
employeeRouter.post("/admin/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      address,
      password,
    } = req.body;

    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ employeeType: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Get the last employee to determine the next employee_id
    const lastEmployee = await Employee.findOne(
      {},
      {},
      { sort: { employee_id: -1 } }
    );
    const employee_id = lastEmployee
      ? lastEmployee.employee_id + 1
      : 1000000000;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Employee({
      employee_id,
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      address,
      password: hashedPassword,
      employeeType: "admin",
    });

    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newAdmin._id,
        type: "employee",
        employeeType: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id: newAdmin._id,
        employee_id: newAdmin.employee_id,
        username: newAdmin.username,
        employeeType: newAdmin.employeeType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Admin login route (for login of admin and staff)
employeeRouter.post("/login", async (req, res) => {
  try {
    const { username, password, employeeType } = req.body;

    // Find employee by username and type (admin or staff)
    const employee = await Employee.findOne({ username, employeeType });
    if (!employee) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: employee._id,
        type: "employee",
        employeeType: employee.employeeType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, employeeType: employee.employeeType });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Staff profile update route
employeeRouter.put("/staff/profile", staffAuth, async (req, res) => {
  try {
    const { userId } = req.user; // Extracted from auth middleware
    const { firstName, lastName, contactNumber, address, email } = req.body;

    // Find the employee by ID
    const employee = await Employee.findById(userId);
    if (!employee || employee.employeeType !== "staff") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update staff profile
    employee.firstName = firstName || employee.firstName;
    employee.lastName = lastName || employee.lastName;
    employee.contactNumber = contactNumber || employee.contactNumber;
    employee.address = address || employee.address;
    employee.email = email || employee.email;

    await employee.save();

    res.json({ message: "Profile updated successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin route to create a new staff
employeeRouter.post("/staff/create", adminAuth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      address,
      password,
      employeeType,
    } = req.body;

    if (employeeType !== "staff") {
      return res
        .status(400)
        .json({ message: "Only staff can be created by the admin" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = new Employee({
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      address,
      password: hashedPassword,
      employeeType,
    });

    await newEmployee.save();
    res
      .status(201)
      .json({ message: "Staff created successfully", newEmployee });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default employeeRouter;
