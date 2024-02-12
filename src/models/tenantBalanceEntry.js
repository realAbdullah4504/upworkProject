const Joi = require("joi");
const mongoose = require("mongoose");

const tenantBalanceEntrySchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  type: { type: String, required: true, minlength: 1, maxlength: 255 },
  date: { type: Date },
  rentalPeriod: { type: String },
  rentDue: { type: Number, default: 0, min: 0 },
  rentPaidByTenant: { type: Number, default: 0, min: 0 },
});

const TenantBalanceEntry = mongoose.model(
  "TenantBalanceEntry",
  tenantBalanceEntrySchema
);

function validateTenantBalanceEntry(entry) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    propertyId: Joi.string().empty(""),
    type: Joi.string().min(0).required(),
    date: Joi.date(),
    rentalPeriod: Joi.string(),
    rentDue: Joi.number().min(0),
    rentPaidByTenant: Joi.number().min(0),
  });

  return schema.validate(entry);
}

exports.tenantBalanceEntrySchema = tenantBalanceEntrySchema;
exports.TenantBalanceEntry = TenantBalanceEntry;
exports.validate = validateTenantBalanceEntry;
