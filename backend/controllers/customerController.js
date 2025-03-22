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

      // Enhanced validation
      if (!password || password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
      }

      if (!username || username.length < 3) {
        return res.status(400).json({
          message: "Username must be at least 3 characters long",
        });
      }

      // Validate contact number format (Philippines format)
      const contactRegex = /^(09|\+639)\d{9}$/;
      if (!contactRegex.test(contactNumber)) {
        return res.status(400).json({
          message:
            "Invalid contact number format. Use 09XXXXXXXXX or +639XXXXXXXXX",
        });
      }

      // Check if user exists with more detailed error
      console.log("Checking for existing user...");
      const existingEmail = await Customer.findOne({ email });
      const existingUsername = await Customer.findOne({ username });

      if (existingEmail) {
        return res.status(400).json({
          message: "Email already registered",
          field: "email",
        });
      }

      if (existingUsername) {
        return res.status(400).json({
          message: "Username already taken",
          field: "username",
        });
      }

      // Hash password
      console.log("Hashing password...");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new customer with trimmed strings
      console.log("Creating new customer...");
      const customer = new Customer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      await customer.save();

      // Generate token with user role
      const token = jwt.sign(
        {
          userId: customer._id,
          type: "customer",
          username: customer.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Send success response without sensitive data
      res.status(201).json({
        message: "Signup successful",
        token,
        user: {
          id: customer._id,
          username: customer.username,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
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
