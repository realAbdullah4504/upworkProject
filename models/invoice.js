const Joi = require("joi");
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  invNum: { type: String, required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  rentalPeriod: { type: String },
  supplier: { type: String, maxlength: 255 },
  category: { type: String, maxlength: 255 },
  description: { type: String, maxlength: 255 },
  amount: { type: Number, min: 0, max: 1000000 },
  paymentStatus: { type: String, maxlength: 255, default: "Unpaid" },
  dateAgentPaidInvoice: { type: Date },
  addToLLBalance: { type: Boolean },
  paidByTenant: { type: Boolean },
  RCND: { type: Boolean },
  paidAmount: { type: Number, min: 0 },
  paidAmountByTenant: { type: Number, min: 0 },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

function validateInvoice(invoice) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    date: Joi.date().required(),
    invNum: Joi.string().required(),
    propertyId: Joi.string().empty(""),
    rentalPeriod: Joi.string(),
    supplier: Joi.string().empty(""),
    category: Joi.string().empty(""),
    description: Joi.string().empty(""),
    amount: Joi.number().min(0).max(100000).required(),
    addToLLBalance: Joi.boolean().optional(),
    paymentStatus: Joi.string().empty(""),
  });

  return schema.validate(invoice);
}

exports.Invoice = Invoice;
exports.validate = validateInvoice;
