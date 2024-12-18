import { Employee } from "../models/Employee.js";

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

      const existingStaff = await Employee.findOne({
        $or: [{ email }, { username }],
      });
      if (existingStaff) {
        return res.status(400).json({ message: "Staff member already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const staff = new Employee({
        employeeType: "staff",
        firstName,
        lastName,
        username,
        contactNumber,
        address,
        email,
        password: hashedPassword,
      });

      await staff.save();
      res.status(201).json({ message: "Staff member created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
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
