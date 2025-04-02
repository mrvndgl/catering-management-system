import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      enum: ["pricing", "system", "reservation"],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", SettingsSchema);

export default Settings;
