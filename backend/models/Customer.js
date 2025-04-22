import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: Number,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[^0-9]+$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid first name! Numbers are not allowed.`,
    },
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
  contactNumber: {
    type: String,
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

// Improved auto-increment with error handling
customerSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastCustomer = await this.constructor.findOne(
        {},
        {},
        { sort: { customer_id: -1 } }
      );
      this.customer_id = lastCustomer ? lastCustomer.customer_id + 1 : 100000;
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const Customer = mongoose.model("Customer", customerSchema);
