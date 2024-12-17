const express = require("express");
const cors = require("cors");


const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const globalErrorHandler = require("./middlewares/globalErrorHandler");
// const userRouter = require("./users/userRouter");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TutorEase's API's" });
});

// app.use("/api/users", userRouter);

app.use(globalErrorHandler);

module.exports = app;
