import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer.js";

export const customerController = {
  signup: async (req, res) => {
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

      // Check if required fields are present
      if (
        !firstName ||
        !lastName ||
        !username ||
        !contactNumber ||
        !address ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      // Password validation - must contain at least one number
      const hasNumber = /\d/.test(password);
      if (!hasNumber) {
        return res.status(400).json({
          message: "Password must contain at least one number",
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        });
      }

      // Check if email already exists
      const existingEmail = await Customer.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }

      // Check if username already exists
      const existingUsername = await Customer.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new customer
      const newCustomer = new Customer({
        firstName,
        lastName,
        username,
        contactNumber,
        address,
        email,
        password: hashedPassword,
      });

      // Save customer to DB
      const savedCustomer = await newCustomer.save();

      // Create JWT token
      const token = jwt.sign(
        { userId: savedCustomer._id, type: "customer" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create a user object without password
      const userResponse = savedCustomer.toObject();
      delete userResponse.password;

      // Return success response
      res.status(201).json({
        message: "Customer registered successfully",
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error("Signup error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      res.status(500).json({
        message: "Server error during signup",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  getCustomerById: async (req, res) => {
    try {
      const customerId = req.params.id;

      const customer = await Customer.findById(customerId)
        .select("firstName lastName email contactNumber")
        .lean();

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching customer details",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
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
