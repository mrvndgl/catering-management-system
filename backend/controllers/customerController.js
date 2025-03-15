import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer.js";

export const customerController = {
  signup: async (req, res) => {
    try {
      console.log("Received signup request body:", {
        ...req.body,
        password: "[REDACTED]",
      });

      const {
        firstName,
        lastName,
        username,
        contactNumber,
        address,
        email,
        password,
      } = req.body;

      // Validate required fields
      const requiredFields = [
        "firstName",
        "lastName",
        "username",
        "contactNumber",
        "address",
        "email",
        "password",
      ];
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate contact number
      if (isNaN(contactNumber) || contactNumber.toString().length < 10) {
        return res.status(400).json({ message: "Invalid contact number" });
      }

      // Check if user exists
      console.log("Checking for existing user...");
      const existingUser = await Customer.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const field = existingUser.email === email ? "email" : "username";
        return res
          .status(400)
          .json({ message: `This ${field} is already registered` });
      }

      // Hash password
      console.log("Hashing password...");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new customer
      console.log("Creating new customer...");
      const customer = new Customer({
        firstName,
        lastName,
        username,
        contactNumber,
        address,
        email,
        password: hashedPassword,
      });

      console.log("Saving customer to database...");
      await customer.save();

      console.log("Generating JWT...");
      const token = jwt.sign(
        { userId: customer._id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      console.log("Signup successful");
      res.status(201).json({
        message: "Signup successful",
        token,
      });
    } catch (error) {
      console.error("Signup error:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
      }

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res
          .status(400)
          .json({ message: `This ${field} is already in use` });
      }

      res.status(500).json({ message: "Server error", error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      console.log("Login endpoint hit with body:", {
        ...req.body,
        password: req.body.password ? "[REDACTED]" : undefined,
      });

      const { username, password } = req.body;

      if (!username || !password) {
        console.log("Missing login credentials");
        return res.status(400).json({
          message: `Missing required fields: ${!username ? "username" : ""}${
            !username && !password ? ", " : ""
          }${!password ? "password" : ""}`,
        });
      }

      console.log("Finding customer with username:", username);
      const customer = await Customer.findOne({ username });
      if (!customer) {
        console.log("No customer found with username:", username);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log("Comparing passwords...");
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        console.log("Password doesn't match");
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log("Login successful, generating token...");
      const token = jwt.sign(
        { userId: customer._id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      const customerResponse = customer.toObject();
      delete customerResponse.password;

      console.log("Sending successful login response");
      res.json({
        token,
        user: customerResponse,
      });
    } catch (error) {
      console.error("Login error:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      res.status(500).json({ message: "Server error" });
    }
  },

  getProfile: async (req, res) => {
    try {
      // Auth middleware attaches decoded JWT to req.user
      const userId = req.user.userId;

      // Fetch customer (exclude password)
      const customer = await Customer.findById(userId)
        .select("-password")
        .lean();

      if (!customer) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};
