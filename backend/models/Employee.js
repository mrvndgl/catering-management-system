import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employee_id: {
    type: Number,
    unique: true,
  },
  employeeType: {
    type: String,
    enum: ["admin", "staff"],
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    default: "",
  },
  lastName: {
    type: String,
    required: true,
    default: "",
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    data: Buffer,
    contentType: String,
  },
  contactNumber: {
    type: String,
    required: true,
    default: "",
  },
  address: {
    type: String,
    required: true,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
});

// Auto-increment employee_id - modified for better reliability
employeeSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.employee_id) {
      const lastEmployee = await this.constructor.findOne(
        {},
        {},
        { sort: { employee_id: -1 } }
      );
      this.employee_id = lastEmployee
        ? lastEmployee.employee_id + 1
        : 1000000000;
      console.log("Auto-assigning employee_id:", this.employee_id);
    }
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
