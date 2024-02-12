const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const properties = require("./src/routes/properties");
const landlords = require("./src/routes/landlords");
const tenants = require("./src/routes/tenants");
const bankingEntries = require("./src/routes/bankingEntries");
const llBalanceEntries = require("./src/routes/llBalanceEntries");
const tenantBalanceEntries = require("./src/routes/tenantBalanceEntries");
const invoices = require("./src/routes/invoices");

app.use(cors());

mongoose
  .connect(
    "mongodb+srv://haytammostaine2002:WwZvM2ygRSHkcBxD@mymongodb.wljkdqz.mongodb.net/myMongoDb?retryWrites=true&w=majority"
  )
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

app.use(express.json());

app.use("/", (req, res) => {
  res.send("server is running...");
});

app.use("/api/properties", properties);
app.use("/api/landlords", landlords);
app.use("/api/tenants", tenants);
app.use("/api/bankingEntries", bankingEntries);
app.use("/api/llBalanceEntries", llBalanceEntries.router);
app.use("/api/tenantBalanceEntries", tenantBalanceEntries.router);
app.use("/api/invoices", invoices.router);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
