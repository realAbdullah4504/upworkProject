const { router } = require("./tenantBalanceEntries");

// Get all balance entries
router.get("/", async (req, res) => {
  const tenantEntries = await TenantBalanceEntry.find().sort("date");
  res.send(tenantEntries);
});
