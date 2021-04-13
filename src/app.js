const express = require("express");
const app = express();
const port = process.env.PORT;

require("./db/mongoose");

// /** Routers */
// const userRouter = require("./Routers/UserRouter");
// const taskRouter = require("./Routers/TaskRouter");

app.use(express.json());
// app.use(userRouter);
// app.use(taskRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));
