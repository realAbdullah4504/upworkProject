const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  tID: { type: String, required: true, minlength: 1, maxlength: 20 },
  name: { type: String, required: true, minlength: 1, maxlength: 255 },
  property: {
    type: new mongoose.Schema({
      pID: { type: String, required: true, minlength: 1, maxlength: 20 },
      address: { type: String, required: true, minlength: 1, maxlength: 255 },
    }),
  },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: "Landlord" },
  rentAmount: { type: Number, min: 0, max: 100000, default: 0 },
  tenantRealStartDate: { type: Date },
  balance: { type: Number, default: 0 },
  refundAmount: { type: Number, min: 0, max: 500000, default: 0 },
});

const Tenant = mongoose.model("Tenant", tenantSchema);

function validateTenant(tenant) {
  const schema = Joi.object({
    _id: Joi.objectId().optional(),
    tID: Joi.string().min(1).max(20).required(),
    name: Joi.string().min(1).max(255).required(),
    rentAmount: Joi.number().min(0).max(100000),
    tenantRealStartDate: Joi.date(),
  });

  return schema.validate(tenant);
}

exports.tenantSchema = tenantSchema;
exports.Tenant = Tenant;
exports.validate = validateTenant;
