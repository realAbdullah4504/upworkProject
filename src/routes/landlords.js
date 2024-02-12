const mongoose = require("mongoose");
const express = require("express");
const { Landlord, validate } = require("../models/landlord");
const router = express.Router();

router.get("/", async (req, res) => {
  const landlords = await Landlord.find().sort("llID");
  res.send(landlords);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { llID, name } = req.body;

  // Check if a landlord already exists
  const landlordExists = await checkLandlordExists(llID, name);
  if (landlordExists) {
    return res
      .status(400)
      .send("Landlord with the same LL-ID or name already exists.");
  }

  let landlord = new Landlord(req.body);
  landlord = await landlord.save();

  res.send(landlord);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { llID, name } = req.body;

  // Check if a landlord already exists
  const landlordExists = await checkLandlordExistsExceptCurrent(
    req.params.id,
    llID,
    name
  );
  if (landlordExists) {
    return res
      .status(400)
      .send("Landlord with the same LL-ID or name already exists.");
  }

  const landlord = await Landlord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!landlord)
    return res
      .status(404)
      .send("The landlord with the given ID was not found.");

  res.send(landlord);
});

router.delete("/:id", async (req, res) => {
  const landlord = await Landlord.findByIdAndDelete(req.params.id);

  if (!landlord)
    return res
      .status(404)
      .send("The landlord with the given ID was not found.");

  res.send(landlord);
});

router.get("/:id", async (req, res) => {
  const landlord = await Landlord.findById(req.params.id);

  if (!landlord)
    return res
      .status(404)
      .send("The landlord with the given ID was not found.");

  res.send(landlord);
});

// Check if a similar landlord  already exists
async function checkLandlordExists(llID, name) {
  return (landlordExists = await Landlord.findOne({
    $or: [{ llID }, { name }],
  }));
}

// Check if a similar landlord already exists, except the current (Pretty self explanatory - Baka)
async function checkLandlordExistsExceptCurrent(currentLandlordId, llID, name) {
  return (landlordExists = await Landlord.findOne({
    _id: { $ne: currentLandlordId },
    $or: [{ llID }, { name }],
  }));
}

module.exports = router;
