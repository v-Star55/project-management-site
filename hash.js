const bcryptjs = require("bcryptjs");

async function run() {
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash("Password@123", salt);
  console.log(hashedPassword);
}

run();
