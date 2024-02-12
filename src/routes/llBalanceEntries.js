const mongoose = require("mongoose");
const express = require("express");
const { LLBalanceEntry } = require("../models/llBalanceEntry");
const router = express.Router();

const dueToLL = [
  "Maintenance Refund",
  "Furniture Refund",
  "Landlord Invoice Refund",
];
const debitedToLL = [
  "Agent Top Up",
  "Agent Invoice Payment",
  "LL Rent Payment",
  "Agreed Rent Reduction (LLRR/TRR)",
  "Agreed Rent Reduction Furniture (LLRR/TRR)",
  "Agreed Rent Reduction Maintenance (LLRR/TRR)",
  "Deposit Received by Tenant",
];

// Get all balance entries
router.get("/", async (req, res) => {
  const llEntries = await LLBalanceEntry.find().sort("date");
  res.send(llEntries);
});

// Get balance enries by property
router.get("/byProperty/:propertyId", async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const llEntriesForProperty = await LLBalanceEntry.find({
      property: propertyId,
    }).sort("rentalPeriod");

    res.send(llEntriesForProperty);
  } catch (error) {
    console.error("Error fetching LLBalanceEntry documents:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function createLLEntry(bankingEntry) {
  console.log("Banking Entry:", bankingEntry);

  const { property, category, date, rentalPeriod, amount } = bankingEntry;

  let llEntry = new LLBalanceEntry({
    property,
    type: category,
    date,
    rentalPeriod,
  });

  if (debitedToLL.includes(category)) {
    llEntry.debitedToLL = amount;
  } else if (dueToLL.includes(category)) {
    llEntry.amountDueToLL = amount;
  } else {
    return null;
  }

  llEntry = await llEntry.save();
  console.log("Saved Entry:", llEntry);

  return llEntry;
}

async function updateLLEntry(updatedBankingEntry, id) {
  console.log("Banking Entry:", updatedBankingEntry);

  const { property, category, date, rentalPeriod, amount } =
    updatedBankingEntry;

  let llEntry = {
    property,
    type: category,
    date,
    rentalPeriod,
  };

  if (debitedToLL.includes(category)) {
    llEntry.debitedToLL = amount;
    llEntry.amountDueToLL = 0;
  } else if (dueToLL.includes(category)) {
    llEntry.amountDueToLL = amount;
    llEntry.debitedToLL = 0;
  } else {
    return null;
  }

  try {
    llEntry = await LLBalanceEntry.findByIdAndUpdate(id, llEntry, {
      new: true,
    });

    console.log("Saved Entry:", llEntry);
    return llEntry;
  } catch (error) {
    console.error("Error updating LLBalanceEntry:", error);
    throw error; // Rethrow the error for handling in the calling code
  }
}

async function deleteLLEntry(id) {
  const llEntry = await LLBalanceEntry.findOneAndDelete(id);
  console.log("Deleted entry:", llEntry);
}

// createLLEntry({
//   propertyId: "6584dee638b04e402193d1d8",
//   type: "RR - Tenant Paid Maintenance (LLRR / TRR)",
//   date: "02/02/2023",
//   rentalPeriod: "01/02/2023 - 28/02/2023",
//   expensesOrInvoices: 819,
// });

// // updateLLEntry(
//   {
//     propertyId: "657dbc7b0d2d2ec718386e25",
//     type: "LL Rent Payment",
//     date: "12/15/2023",
//     rentalPeriod: "05/08/2023 - 04/09/2023",
//     debitedToLL: 5000,
//   },
//   "6584c560f640681ed6243907"
// );

// deleteLLEntry("6584c560f640681ed6243907");

module.exports = {
  router: router,
  createLLEntry: createLLEntry,
  updateLLEntry: updateLLEntry,
  deleteLLEntry: deleteLLEntry,
};
