const Joi = require("joi");
const mongoose = require("mongoose");

const bankingEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, required: true }, // Credit or Debit
  category: { type: String, required: true, minlength: 0, maxlength: 255 }, // The type of credit or debit
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  invoiceNum: { type: String },
  amount: { type: Number, min: 0, max: 100000 },
  rentalPeriod: { type: String },
  reference: { type: String },
  toFromAccount: { type: String },
  runningBalance: { type: Number },
  complete: { type: Boolean },
  invoiceListed: { type: Boolean },
  llEntry: { type: mongoose.Schema.Types.ObjectId, ref: "LLEntry" },
  tenantEntry: { type: mongoose.Schema.Types.ObjectId, ref: "TenantEntry" },
});

const BankingEntry = mongoose.model("BankingEntry", bankingEntrySchema);

function validateBankingEntry(bankingEntry) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    date: Joi.date().required(),
    type: Joi.string().required(),
    category: Joi.string().min(0).max(255).required(),
    propertyId: Joi.string().empty(""),
    invoiceNum: Joi.string().min(0).max(20),
    amount: Joi.number().min(0).max(100000).required(),
    rentalPeriod: Joi.string(),
    reference: Joi.string().allow(""),
    toFromAccount: Joi.string().allow(""),
    complete: Joi.boolean(),
    invoiceListed: Joi.boolean(),
  });

  return schema.validate(bankingEntry);
}

exports.BankingEntry = BankingEntry;
exports.validate = validateBankingEntry;
