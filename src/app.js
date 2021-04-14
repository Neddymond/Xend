const express = require("express");
const app = express();
const port = process.env.PORT;
const path = require("path");

require("./db/mongoose");

// /** Routers */
const paymentRouter = require("./routers/paymentRouter");

// /** View Engine setup */
// app.set('views', path.join(__dirname, './views'));
// app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/views"));

app.use(express.json());
app.use(paymentRouter);

// app.get("/", (req, res) => {
//   res.render("verifyAccount", { title: "Verify Account Number" });
// });

app.listen(port, () => console.log(`Server is running on port ${port}`));