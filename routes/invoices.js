const mongoose = require("mongoose");
const express = require("express");
const { Invoice, validate } = require("../models/invoice");
const { BankingEntry } = require("../models/bankingEntry");
const router = express.Router();

router.get("/", async (req, res) => {
  const invoices = await Invoice.find()
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
  res.send(invoices);
});

router.get("/byProperty/:propertyId", async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const invoices = await Invoice.find({ property: propertyId }).sort("date");

    res.send(invoices);
  } catch (error) {
    console.error("Error fetching LLBalanceEntry documents:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { invNum } = req.body;

  // Check if a invoice already exists
  const invoiceExists = await checkInvoiceExists(invNum);
  if (invoiceExists) {
    return res.status(400).send("This invoice number already exists.");
  }

  let invoice = new Invoice({ ...req.body, property: req.body.propertyId });
  invoice = await invoice.save();

  // Prepare response
  invoice = await Invoice.findById(invoice._id).populate({
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

  res.send(invoice);
});

router.put("/:id", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { invNum } = req.body;

  // Check if a invoice already exists
  const invoiceExists = await checkInvoiceExistsExceptCurrent(
    req.params.id,
    invNum
  );
  if (invoiceExists) {
    return res.status(400).send("This invoice number already exists.");
  }

  let updatedInvoice = { ...req.body, property: req.body.propertyId };
  console.log("Updated Invoice before updating status:", updatedInvoice);
  updatedInvoice = await updatePaymentStatus(updatedInvoice);
  console.log("Updated Invoice after updating status:", updatedInvoice);

  let invoice = await Invoice.findByIdAndUpdate(req.params.id, updatedInvoice, {
    new: true,
  });

  if (!invoice)
    return res
      .status(404)
      .send("The invoice with the given invoice number was not found.");

  // Prepare response
  invoice = await Invoice.findById(invoice._id).populate({
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
  res.send(invoice);
});

router.delete("/:id", async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);

  if (!invoice)
    return res
      .status(404)
      .send("The invoice with the given invoice number was not found.");

  res.send(invoice);
});

router.get("/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice)
    return res
      .status(404)
      .send("The invoice with the given invoice number was not found.");

  res.send(invoice);
});

// Check if a similar invoice  already exists
async function checkInvoiceExists(invNum) {
  return (invoiceExists = await Invoice.findOne({ invNum }));
}

async function checkInvoiceExistsExceptCurrent(currentInvoiceId, invNum) {
  return (invoiceExists = await Invoice.findOne({
    _id: { $ne: currentInvoiceId },
    invNum: invNum,
  }));
}

async function updatePaymentStatus(invoice) {
  try {
    console.log("Invoice in the function:", invoice);
    // Condition 1: Added to Landlord
    if (invoice.addToLLBalance) {
      console.log("I'm in condition 1!");
      return { ...invoice, paymentStatus: "Charged to Landlord" };
    }

    // Condition 2: Paid by the Agent
    const bankingEntriesAgent = await getBankingEntries(
      invoice.invNum,
      "Payment of Invoices"
    );
    console.log("Hi there - Payment of Invoices", bankingEntriesAgent);

    const totalAmountAgent = bankingEntriesAgent.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    if (totalAmountAgent === invoice.amount) {
      console.log("I'm in condition 2!");
      return { ...invoice, paymentStatus: "Paid by the Agent" };
    } else if (totalAmountAgent > 0) {
      console.log("I'm in condition 3!");
      return { ...invoice, paymentStatus: "Partially Paid" };
    }

    // Condition 4: Paid by the Agent (using a different category)
    const bankingEntriesFurniture = await getBankingEntries(
      invoice.invNum,
      "LL Furniture Allowance (LLRR/T--)"
    );
    console.log("Hi there Furniture", bankingEntriesFurniture);
    const totalAmountFurniture = bankingEntriesFurniture.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    if (totalAmountFurniture === invoice.amount) {
      console.log("I'm in condition 4!");
      return { ...invoice, paymentStatus: "Paid by the Agent" };
    } else if (totalAmountFurniture > 0) {
      console.log("I'm in condition 5!");
      return { ...invoice, paymentStatus: "Partially Paid" };
    }
    console.log("i made it to unpaid");
    // If none of the conditions are met, set default status
    return { ...invoice, paymentStatus: "Unpaid" };
  } catch (error) {
    // Handle any errors that might occur during the process
    console.error("Error updating payment status:", error);
    throw error; // Rethrow the error to be handled by the calling function or middleware
  }
}

// Helper function to get banking entries for a specific invoice with optional category filter
async function getBankingEntries(invNum, category = null) {
  try {
    console.log("invNum in the getBankingEntries", invNum, "categ", category);
    const query = { invoiceNum: invNum };

    if (category !== null) {
      query.category = category;
    }

    const bankingEntries = await BankingEntry.find(query);
    return bankingEntries;
  } catch (error) {
    console.error("Error fetching banking entries:", error);
    return [];
  }
}

module.exports = {
  router: router,
  updatePaymentStatus: updatePaymentStatus,
};
