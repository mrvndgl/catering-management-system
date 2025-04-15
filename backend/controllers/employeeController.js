import { Employee } from "../models/Employee.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const employeeController = {
  login: async (req, res) => {
    try {
      const { username, password, employeeType } = req.body;

      const employee = await Employee.findOne({ username, employeeType });
      if (!employee) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

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
      res.status(500).json({ message: "Server error" });
    }
  },

  createStaff: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        username,
        contactNumber,
        address,
        email,
        password,
      } = req.body;

      console.log("Creating staff with data:", {
        firstName,
        lastName,
        username,
        contactNumber: contactNumber ? "provided" : "missing",
        address: address ? "provided" : "missing",
        email,
      });

      const existingStaff = await Employee.findOne({
        $or: [{ email }, { username }],
      });
      if (existingStaff) {
        return res.status(400).json({ message: "Staff member already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const staff = new Employee({
        employeeType: "staff",
        firstName: firstName || "",
        lastName: lastName || "",
        username,
        contactNumber: contactNumber || "",
        address: address || "",
        email,
        password: hashedPassword,
      });

      // Log the staff object before saving
      console.log("Staff object before save:", staff);

      const savedStaff = await staff.save();
      console.log("Staff saved successfully:", savedStaff);

      // Return the created staff without password
      const staffToReturn = savedStaff.toObject();
      delete staffToReturn.password;

      res.status(201).json({
        message: "Staff member created successfully",
        employee: staffToReturn,
      });
    } catch (error) {
      console.error("Staff creation error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  updateStaffProfile: async (req, res) => {
    try {
      const { firstName, lastName, contactNumber, address, email } = req.body;
      const updatedStaff = await Employee.findByIdAndUpdate(
        req.user.userId,
        {
          firstName,
          lastName,
          contactNumber,
          address,
          email,
        },
        { new: true }
      ).select("-password");

      res.json(updatedStaff);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },

  getProfile: async (req, res) => {
    try {
      const employee = await Employee.findById(req.user.userId).select(
        "-password"
      );
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
};
