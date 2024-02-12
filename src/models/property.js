const Joi = require("joi");
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  pID: { type: String, required: true, minlength: 1, maxlength: 20 },
  address: { type: String, required: true, minlength: 1, maxlength: 255 },
  postCode: { type: String, minlength: 0, maxlength: 255 },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: "Landlord" },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
});

const Property = mongoose.model("Property", propertySchema);

function validateProperty(property) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    pID: Joi.string().min(1).max(20).required(),
    address: Joi.string().min(1).max(255).required(),
    postCode: Joi.string().min(0).max(255),
    landlordId: Joi.string().empty(""),
    tenantId: Joi.string().empty(""),
  });

  return schema.validate(property);
}

exports.Property = Property;
exports.validate = validateProperty;
