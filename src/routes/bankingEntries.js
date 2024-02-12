const express = require("express");
const { BankingEntry, validate } = require("../models/bankingEntry");
const router = express.Router();
const {
  createLLEntry,
  updateLLEntry,
  deleteLLEntry,
} = require("../routes/llBalanceEntries");
const {
  createTenantEntry,
  updateTenantEntry,
  deleteTenantEntry,
} = require("./tenantBalanceEntries");
const { Invoice } = require("../models/invoice");
const { updatePaymentStatus } = require("./invoices");

router.get("/", async (req, res) => {
  const bankingEntries = await BankingEntry.find()
    .sort("date")
    .populate({
      path: "property",
      select: "pID landlord tenant",
      populate: [
        {
          path: "landlord",
          model: "Landlord",
          select: "llID",
        },
        {
          path: "tenant",
          model: "Tenant",
          select: "tID",
        },
      ],
    });

  res.send(bankingEntries);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let bankingEntry = new BankingEntry({
    ...req.body,
    property: req.body.propertyId,
  });

  // Create an entry in the LL balance sheet
  const llEntry = await createLLEntry(bankingEntry);

  // Add the llEntry to bankingEntry
  if (llEntry) bankingEntry.llEntry = llEntry._id;

  // Create an entry in tenant balance sheet
  const tenantEntry = await createTenantEntry(bankingEntry);

  // Add the tenantEntry to bankingEntry
  if (tenantEntry) bankingEntry.tenantEntry = tenantEntry._id;

  bankingEntry = await bankingEntry.save();

  // Update the invoice if needed
  if (bankingEntry.invoiceNum) {
    // Fetch the invoice from the database
    let invoice = await Invoice.findOne({ invNum: bankingEntry.invoiceNum });

    // Update its payment status
    const updatedInvoice = await updatePaymentStatus(invoice._doc);

    // Save the updated invoice
    invoice = await Invoice.findByIdAndUpdate(invoice._id, updatedInvoice);
  }

  // Prepare response
  bankingEntry = await BankingEntry.findById(bankingEntry._id).populate({
    path: "property",
    select: "pID landlord tenant",
    populate: [
      {
        path: "landlord",
        model: "Landlord",
        select: "llID",
      },
      {
        path: "tenant",
        model: "Tenant",
        select: "tID",
      },
    ],
  });

  res.send(bankingEntry);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const oldBankingEntry = await BankingEntry.findById(req.params.id);

  let newBankingEntry = {
    ...req.body,
    property: req.body.propertyId,
  };

  let llEntry;
  let tenantEntry;

  // Update llEntry
  if (oldBankingEntry.llEntry) {
    llEntry = await updateLLEntry(newBankingEntry, oldBankingEntry.llEntry);

    // IF the newBankingEntry doesn't fall under any llEntry type, then it's a tenant entry, so we create a tenant entry and delete the old ll entry
    if (!llEntry) {
      await deleteLLEntry(oldBankingEntry.llEntry);

      // If we don't have an old tenantEntry to update, we create it here
      if (!oldBankingEntry.tenantEntry)
        tenantEntry = await createTenantEntry(newBankingEntry);
    }
  }

  // Update tenantEntry
  if (oldBankingEntry.tenantEntry) {
    tenantEntry = await updateTenantEntry(
      newBankingEntry,
      oldBankingEntry.tenantEntry
    );
    console.log("THIS IS TENANTENTRY", tenantEntry, "boolean: ", !tenantEntry);
    // IF the newBankingEntry doesn't fall under any tenantEntry type, then it's a ll entry, so we create a ll entry and delete the old tenant entry
    if (!tenantEntry) {
      await deleteTenantEntry(oldBankingEntry.tenantEntry);

      // If we don't have an old llEntry to update, we create it here
      if (!oldBankingEntry.llEntry)
        llEntry = await createLLEntry(newBankingEntry);
    }
  }

  // Update bankingEntry
  const bankingEntry = await BankingEntry.findByIdAndUpdate(
    req.params.id,
    { ...newBankingEntry, llEntry, tenantEntry },
    {
      new: true,
    }
  );

  // Update the invoice if needed
  if (bankingEntry.invoiceNum) {
    // Fetch the invoice from the database
    let invoice = await Invoice.findOne({ invNum: bankingEntry.invoiceNum });

    // Update its payment status
    const updatedInvoice = await updatePaymentStatus(invoice._doc);

    // Save the updated invoice
    invoice = await Invoice.findByIdAndUpdate(invoice._id, updatedInvoice);
  }

  if (!bankingEntry)
    return res
      .status(404)
      .send("The banking entry with the given ID was not found.");

  res.send(bankingEntry);
});

router.delete("/:id", async (req, res) => {
  const oldBankingEntry = await BankingEntry.findById(req.params.id);

  // Delete llEntry
  if (oldBankingEntry?.llEntry) await deleteLLEntry(oldBankingEntry.llEntry);

  // Delete tenantEntry
  if (oldBankingEntry?.tenantEntry)
    await deleteTenantEntry(oldBankingEntry.tenantEntry);

  // Delete banking entry
  const bankingEntry = await BankingEntry.findByIdAndDelete(req.params.id);

  // Update the invoice if needed
  if (bankingEntry.invoiceNum) {
    // Fetch the invoice from the database
    let invoice = await Invoice.findOne({ invNum: bankingEntry.invoiceNum });

    // Update its payment status
    const updatedInvoice = await updatePaymentStatus(invoice._doc);

    // Save the updated invoice
    invoice = await Invoice.findByIdAndUpdate(invoice._id, updatedInvoice);
  }

  if (!bankingEntry)
    return res
      .status(404)
      .send("The banking entry with the given ID was not found.");

  res.send(bankingEntry);
});

router.get("/:id", async (req, res) => {
  const bankingEntry = await BankingEntry.findById(req.params.id);

  if (!bankingEntry)
    return res
      .status(404)
      .send("The banking entry with the given ID was not found.");

  res.send(bankingEntry);
});

module.exports = router;
