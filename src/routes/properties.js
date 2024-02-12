const mongoose = require("mongoose");
const express = require("express");
const { Property, validate } = require("../models/property");
const { Landlord } = require("../models/landlord");
const { Tenant } = require("../models/tenant");
const router = express.Router();

router.get("/", async (req, res) => {
  const properties = await Property.find()
    .sort("pID")
    .populate(
      "landlord",
      "llID rentPeriodStart rentPeriodEnd contractStartDate rentAmount name"
    )
    .populate("tenant", "tID name rentAmount");
  res.send(properties);
});

router.post("/", async (req, res) => {
  // Validating what we get from the client with Joi
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { pID, address, landlordId, tenantId } = req.body;

  // Check if a property with the same pID or address already exists
  const propertyExists = await checkPropertyExists(
    pID,
    address,
    landlordId,
    tenantId
  );
  if (propertyExists) {
    return res
      .status(400)
      .send(
        "Property with the same pID, address, LL-ID or T-ID already exists."
      );
  }

  // Creating a new property
  let property = new Property({
    pID: pID,
    address: address,
    postCode: req.body.postCode,
    tID: req.body.tID,
  });

  // Adding the landlord if it exists
  if (landlordId) {
    let landlord = await Landlord.findById(landlordId);
    if (!landlord) return res.status(400).send("Invalid landlord.");

    property.landlord = landlordId;
  }

  // Adding the tenant if it exists
  if (tenantId) {
    let tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(400).send("Invalid tenant.");

    property.tenant = tenantId;
  }

  // TODO: Add Transaction?
  property = await property.save();
  await Landlord.findByIdAndUpdate(landlordId, {
    property: { pID: property.pID, address: property.address },
  });
  await Tenant.findByIdAndUpdate(tenantId, {
    property: {
      pID: property.pID,
      address: property.address,
    },
    landlord: property.landlord,
  });

  // Populate the landlord & tenant fields in the property to send in response
  property = await Property.findById(property._id)
    .populate("landlord", "llID")
    .populate("tenant", "tID");

  // Sending the new property to the client
  res.send(property);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { pID, address, landlordId, tenantId } = req.body;

  // Check if another property already exists with the same pID or address
  const propertyExists = await checkPropertyExistsExceptCurrent(
    req.params.id,
    pID,
    address,
    landlordId,
    tenantId
  );
  if (propertyExists) {
    return res
      .status(400)
      .send(
        "Property with the same P-ID, address, LL-ID or T-ID already exists."
      );
  }

  const oldProperty = await Property.findById(req.params.id);

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    {
      pID: req.body.pID,
      address: req.body.address,
      postCode: req.body.postCode,
      landlord: req.body.landlordId || null,
      tenant: req.body.tenantId || null,
    },
    { new: true }
  );

  if (!property)
    return res
      .status(404)
      .send("The property with the given ID was not found.");

  // Update old landlord & tenant
  await Landlord.findByIdAndUpdate(oldProperty.landlord, {
    property: null,
  });
  await Tenant.findByIdAndUpdate(oldProperty.tenant, {
    property: null,
    landlord: null,
  });

  // Update new landlord & tenant
  await Landlord.findByIdAndUpdate(req.body.landlordId, {
    property: { pID: property.pID, address: property.address },
  });
  await Tenant.findByIdAndUpdate(req.body.tenantId, {
    property: { pID: property.pID, address: property.address },
    landlord: property.landlord,
  });

  res.send(property);
});

router.delete("/:id", async (req, res) => {
  const property = await Property.findByIdAndDelete(req.params.id);

  if (!property)
    return res
      .status(404)
      .send("The property with the given ID was not found.");

  // Update landlord & tenant
  await Landlord.findByIdAndUpdate(property.landlord, {
    property: null,
  });
  await Tenant.findByIdAndUpdate(property.tenant, {
    property: null,
    landlord: null,
  });

  res.send(property);
});

router.get("/:id", async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "landlord",
    "llID -_id"
  );

  if (!property)
    return res
      .status(404)
      .send("The property with the given ID was not found.");

  res.send(property);
});

// Check if a property with the same pID or address already exists
async function checkPropertyExists(pID, address, landlord, tenant) {
  return (propertyExists = await Property.findOne({
    $or: [
      { pID },
      { address },
      { landlord: { $eq: landlord, $ne: null } },
      { tenant: { $eq: tenant, $ne: null } },
    ],
  }));
}

// Check if a property with the same pID or address already exists, except the current property
async function checkPropertyExistsExceptCurrent(
  currentPropertyId,
  pID,
  address,
  landlord,
  tenant
) {
  return (propertyExists = await Property.findOne({
    _id: { $ne: currentPropertyId },
    $or: [
      { pID },
      { address },
      { landlord: { $eq: landlord, $ne: null } }, // Exclude null but include other landlords
      { tenant: { $eq: tenant, $ne: null } },
    ],
  }));
}

module.exports = router;

// Transaction function I had before
/*
async function createProperty(property, landlordId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step 1: Save the property to the database
    await property.save({ session });

    // Step 2: Update the landlord collection
    await Landlord.findByIdAndUpdate(
      landlordId,
      {
        property: { pID: property.pID, address: property.address },
      },
      { session }
    );

    // Commit the transaction if both steps are successful
    await session.commitTransaction();

    // End the session
    session.endSession();

    // Return the property object
    return property;
  } catch (error) {
    // Handle error
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction failed: ", error);
  }
}
*/
