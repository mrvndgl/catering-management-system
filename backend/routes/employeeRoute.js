import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import {
  auth,
  adminAuth,
  staffAuth,
  adminStaffAuth,
} from "../middleware/auth.js";

const employeeRouter = express.Router();

// Get all staff accounts (admin only)
employeeRouter.get("/staff", adminAuth, async (req, res) => {
  try {
    const staffAccounts = await Employee.find({ employeeType: "staff" })
      .select("-password -photo")
      .sort({ employee_id: 1 });
    res.json(staffAccounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete staff account (admin only)
employeeRouter.delete("/staff/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.findOneAndDelete({ _id: id, employeeType: "staff" });
    res.json({ message: "Staff account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

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

// Login route (for both admin and staff)
employeeRouter.post("/login", async (req, res) => {
  try {
    const { username, password, employeeType } = req.body;

    console.log("Login attempt:", { username, employeeType });

    // Find employee by username and type
    const employee = await Employee.findOne({ username, employeeType });
    console.log("Employee found:", employee ? "Yes" : "No");

    if (!employee) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, employee.password);
    console.log("Password match:", isMatch);

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
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Staff profile update route
employeeRouter.put("/staff/profile", staffAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { firstName, lastName, contactNumber, address, email } = req.body;

    const employee = await Employee.findById(userId);
    if (!employee || employee.employeeType !== "staff") {
      return res.status(403).json({ message: "Not authorized" });
    }

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

// Create new staff account (admin only)
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

    console.log("Attempting to create staff member:", {
      username,
      employeeType,
    });

    if (employeeType !== "staff") {
      return res
        .status(400)
        .json({ message: "Only staff accounts can be created" });
    }

    // Check if username or email already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ username }, { email }],
    });

    if (existingEmployee) {
      return res.status(400).json({
        message:
          existingEmployee.username === username
            ? "Username already exists"
            : "Email already exists",
      });
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

    // Create new employee
    const newEmployee = new Employee({
      employee_id,
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

    // Remove password from response
    const employeeResponse = newEmployee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      message: "Staff created successfully",
      employee: employeeResponse,
    });
  } catch (error) {
    console.error("Staff creation error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Update staff account (admin only)
employeeRouter.put("/staff/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, contactNumber, address } = req.body;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: id, employeeType: "staff" },
      {
        firstName,
        lastName,
        email,
        contactNumber,
        address,
      },
      { new: true }
    ).select("-password -photo");

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({
      message: "Staff updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default employeeRouter;
