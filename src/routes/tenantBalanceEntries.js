const mongoose = require("mongoose");
const express = require("express");
const { TenantBalanceEntry } = require("../models/tenantBalanceEntry");
const router = express.Router();

const rentDue = ["Agreed Rent Increase (LL-/TRI)"];
const rentPaidByTenant = [
  "Tenant Credit",
  "Deposit Paid by Tenant",
  "Tenant Invoice Payment",
  "Deposit Received by Tenant",
  "Agreed Rent Reduction (LLRR/TRR)",
  "Agreed Rent Reduction Furniture (LLRR/TRR)",
  "Agreed Rent Reduction Maintenance (LLRR/TRR)",
  "Agent Rent Reduction (LL-/TRR)",
  "Statement Amendment",
  "Refund",
];

// Get all balance entries
router.get("/", async (req, res) => {
  const tenantEntries = await TenantBalanceEntry.find().sort("date");
  res.send(tenantEntries);
});

// Get balance enries by property
router.get("/byProperty/:propertyId", async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const tenantEntriesForProperty = await TenantBalanceEntry.find({
      property: propertyId,
    }).sort("rentalPeriod");

    res.send(tenantEntriesForProperty);
  } catch (error) {
    console.error("Error fetching TenantBalanceEntry documents:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function createTenantEntry(bankingEntry) {
  console.log("Banking Entry:", bankingEntry);

  const { property, category, date, rentalPeriod, amount } = bankingEntry;

  let tenantEntry = new TenantBalanceEntry({
    property,
    type: category,
    date,
    rentalPeriod,
  });

  if (rentDue.includes(category)) {
    tenantEntry.rentDue = amount;
  } else if (rentPaidByTenant.includes(category)) {
    tenantEntry.rentPaidByTenant = amount;
  } else {
    return null;
  }

  tenantEntry = await tenantEntry.save();
  console.log("Saved Entry:", tenantEntry);

  return tenantEntry;
}

async function updateTenantEntry(updatedBankingEntry, id) {
  console.log("Banking Entry:", updatedBankingEntry);

  const { property, category, date, rentalPeriod, amount } =
    updatedBankingEntry;

  let tenantEntry = {
    property,
    type: category,
    date,
    rentalPeriod,
  };

  if (rentDue.includes(category)) {
    tenantEntry.rentDue = amount;
    tenantEntry.rentPaidByTenant = 0;
  } else if (rentPaidByTenant.includes(category)) {
    tenantEntry.rentPaidByTenant = amount;
    tenantEntry.rentDue = 0;
  } else {
    return null;
  }

  try {
    tenantEntry = await TenantBalanceEntry.findByIdAndUpdate(id, tenantEntry, {
      new: true,
    });

    console.log("Saved Entry:", tenantEntry);
    return tenantEntry;
  } catch (error) {
    console.error("Error updating TenantBalanceEntry:", error);
    throw error; // Rethrow the error for handling in the calling code
  }
}

async function deleteTenantEntry(id) {
  const tenantEntry = await TenantBalanceEntry.findOneAndDelete(id);
  console.log("Deleted entry:", tenantEntry);
}

// createTenantEntry({
//   propertyId: "6584dee638b04e402193d1d8",
//   category: "Tenant Credit",
//   date: "09/10/2023",
//   rentalPeriod: "01/11/2023 - 30/11/2023",
//   amount: 5000,
// });

// updateTenantEntry(
//   {
//     propertyId: "6584dee638b04e402193d1d8",
//     category: "Tenant Credit",
//     date: "09/10/2023",
//     rentalPeriod: "01/11/2023 - 30/11/2023",
//     amount: 7584,
//   },
//   "6589efe9eb3019aa2146a5a0"
// );

// deleteTenantEntry("6589efe9eb3019aa2146a5a0");

module.exports = {
  router: router,
  createTenantEntry: createTenantEntry,
  updateTenantEntry: updateTenantEntry,
  deleteTenantEntry: deleteTenantEntry,
};
