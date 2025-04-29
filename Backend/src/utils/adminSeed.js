const UserModel = require("../users/userModel");
const bcrypt = require("bcrypt");

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await UserModel.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin already exists.");
      return;
    }

    const defaultAdmin = {
      username: "admin",
      email: "admin@gmail.com",
      password: "Admin@123",
      grade: "N/A",
      phoneNumber: "0000000000",
      address: "Default Admin Address",
      role: "admin",
      isEmailVerified: true,
    };

    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
    defaultAdmin.password = hashedPassword;

    await UserModel.create(defaultAdmin);
    console.log("✅ Default admin created.");
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
};

module.exports = createDefaultAdmin;
