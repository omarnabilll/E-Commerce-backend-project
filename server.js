require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const errorHandler = require("./middleware/errorHandler");

const DBconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connected");
  } catch (err) {
    console.log("error connecting to DB");
    console.log(err);
    process.exit(1);
  }
};
DBconnection();

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`server is running on http://localhost:${process.env.PORT}`);
});
