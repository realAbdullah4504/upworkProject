const Joi = require("joi");
const mongoose = require("mongoose");

const llBalanceEntrySchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  type: { type: String, required: true, minlength: 1, maxlength: 255 },
  date: { type: Date },
  rentalPeriod: { type: String },
  amountDueToLL: { type: Number, default: 0, min: 0 },
  debitedToLL: { type: Number, default: 0, min: 0 },
  expensesOrInvoices: { type: Number, default: 0, min: 0 },
});

const LLBalanceEntry = mongoose.model("LLBalanceEntry", llBalanceEntrySchema);

function validateLLBalanceEntry(entry) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    propertyId: Joi.string().empty(""),
    type: Joi.string().min(0).required(),
    date: Joi.date(),
    rentalPeriod: Joi.string(),
    amountDueToLL: Joi.number().min(0),
    debitedToLL: Joi.number().min(0),
    expensesOrInvoices: Joi.number().min(0),
  });

  return schema.validate(entry);
}

exports.llBalanceEntrySchema = llBalanceEntrySchema;
exports.LLBalanceEntry = LLBalanceEntry;
exports.validate = validateLLBalanceEntry;
