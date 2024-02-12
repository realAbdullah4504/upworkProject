const mongoose = require("mongoose");
const express = require("express");
const { Tenant, validate } = require("../models/tenant");
const router = express.Router();

router.get("/", async (req, res) => {
  const tenants = await Tenant.find()
    .sort("tID")
    .populate("landlord", "rentPeriodStart rentPeriodEnd contractStartDate");
  res.send(tenants);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { tID, name } = req.body;

  // Check if a tenant already exists
  const tenantExists = await checkTenantExists(tID, name);
  if (tenantExists) {
    return res
      .status(400)
      .send("Tenant with the same T-ID or name already exists.");
  }

  let tenant = new Tenant(req.body);
  tenant = await tenant.save();

  res.send(tenant);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { tID, name } = req.body;

  // Check if a tenant already exists
  const tenantExists = await checkTenantExistsExceptCurrent(
    req.params.id,
    tID,
    name
  );
  if (tenantExists) {
    return res
      .status(400)
      .send("Tenant with the same T-ID or name already exists.");
  }

  const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!tenant)
    return res.status(404).send("The tenant with the given ID was not found.");

  res.send(tenant);
});

router.delete("/:id", async (req, res) => {
  const tenant = await Tenant.findByIdAndDelete(req.params.id);

  if (!tenant)
    return res.status(404).send("The tenant with the given ID was not found.");

  res.send(tenant);
});

router.get("/:id", async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant)
    return res.status(404).send("The tenant with the given ID was not found.");

  res.send(tenant);
});

// Check if a similar tenant  already exists
async function checkTenantExists(tID, name) {
  return (tenantExists = await Tenant.findOne({
    $or: [{ tID }, { name }],
  }));
}

// Check if a similar tenant already exists, except the current (Pretty self explanatory - Baka)
async function checkTenantExistsExceptCurrent(currentTenantId, tID, name) {
  return (tenantExists = await Tenant.findOne({
    _id: { $ne: currentTenantId },
    $or: [{ tID }, { name }],
  }));
}

module.exports = router;
