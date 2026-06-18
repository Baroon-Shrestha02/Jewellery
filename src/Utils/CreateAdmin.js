import bcrypt from "bcrypt";
import User from "../Models/UserModel.js";

const createAdminIfNotExists = async () => {
  try {
    const adminExists = await User.findOne({
      email: "sahilsonar858@gmail.com",
    });

    if (adminExists) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      firstname: "Sahil Sonar",
      lastname: "Admin",
      phone: "1234567892",
      email: "sahilsonar858@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin created successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

export default createAdminIfNotExists;
