const express = require("express");
const app = express();

require("./db/mongoose");

/** Routers */
const userRouter = require("./Routers/UserRouter");
const taskRouter = require("./Routers/TaskRouter");

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
