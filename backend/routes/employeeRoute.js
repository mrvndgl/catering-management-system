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
employeeRouter.get("/staff", adminStaffAuth, async (req, res) => {
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

    const employee = await Employee.findOne({ username });

    if (!employee) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is archived
    if (employee.isArchived) {
      return res.status(403).json({
        message:
          "This account has been archived. Please contact your administrator.",
      });
    }

    // Continue with existing login logic
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

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

    console.log("Creating staff account with data:", {
      firstName: firstName || "missing",
      lastName: lastName || "missing",
      username,
      email,
      contactNumber: contactNumber || "missing",
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee with proper defaults for required fields
    const newEmployee = new Employee({
      firstName: firstName || "",
      lastName: lastName || "",
      username,
      email,
      contactNumber: contactNumber || "",
      address: address || "",
      password: hashedPassword,
      employeeType,
    });

    const savedEmployee = await newEmployee.save();
    console.log("Employee saved with ID:", savedEmployee.employee_id);

    // Remove password from response
    const employeeResponse = savedEmployee.toObject();
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
    const { firstName, lastName, email, contactNumber, address, username } =
      req.body;

    // Only update fields that have actual values
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (contactNumber) updateFields.contactNumber = contactNumber;
    if (address) updateFields.address = address;
    if (username) updateFields.username = username;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: id, employeeType: "staff" },
      updateFields,
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

employeeRouter.patch("/staff/archive/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndUpdate(
      { _id: id, employeeType: "staff" },
      { isArchived: true },
      { new: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({
      message: "Staff archived successfully",
      employee,
    });
  } catch (error) {
    console.error("Archive error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Unarchive staff account
employeeRouter.patch("/staff/unarchive/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndUpdate(
      { _id: id, employeeType: "staff" },
      { isArchived: false },
      { new: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    res.json({ message: "Staff unarchived successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get archived staff accounts
employeeRouter.get("/staff/archived", adminAuth, async (req, res) => {
  try {
    const archivedStaff = await Employee.find({
      employeeType: "staff",
      isArchived: true,
    }).select("-password -photo");
    res.json(archivedStaff);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get admin profile
employeeRouter.get("/admin/profile", adminAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const admin = await Employee.findById(userId).select("-password -photo");

    if (!admin || admin.employeeType !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update admin profile
employeeRouter.put("/admin/profile", adminAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { firstName, lastName, email, contactNumber, address } = req.body;

    const admin = await Employee.findById(userId);
    if (!admin || admin.employeeType !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update only provided fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (email) admin.email = email;
    if (contactNumber) admin.contactNumber = contactNumber;
    if (address) admin.address = address;

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.photo;

    res.json({
      message: "Admin profile updated successfully",
      admin: adminResponse,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update admin password
employeeRouter.put("/admin/password", adminAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    const admin = await Employee.findById(userId);
    if (!admin || admin.employeeType !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    res.json({ message: "Admin password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default employeeRouter;
