const express = require("express");
const app = express();
const port = process.env.PORT;
const path = require("path");

require("./db/mongoose");

// /** Routers */
const paymentRouter = require("./routers/paymentRouter");


app.use(express.json());
app.use(paymentRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));