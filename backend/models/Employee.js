import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employee_id: {
    type: Number,
    required: true,
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
  },
  lastName: {
    type: String,
    required: true,
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
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
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
});

// Auto-increment employee_id
employeeSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastEmployee = await this.constructor.findOne(
      {},
      {},
      { sort: { employee_id: -1 } }
    );
    this.employee_id = lastEmployee ? lastEmployee.employee_id + 1 : 1000000000;
  }
  next();
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
