const Joi = require("joi");
const mongoose = require("mongoose");

const landlordSchema = new mongoose.Schema({
  llID: { type: String, required: true, minlength: 1, maxlength: 20 },
  name: { type: String, required: true, minlength: 1, maxlength: 255 },
  property: {
    type: new mongoose.Schema({
      pID: { type: String, required: true, minlength: 1, maxlength: 20 },
      address: { type: String, required: true, minlength: 1, maxlength: 255 },
    }),
  },
  rentAmount: { type: Number, min: 0, max: 100000, default: 0 },
  rentPeriodStart: { type: Date },
  rentPeriodEnd: { type: Date },
  contractStartDate: { type: Date },
  rentBalanceOwed: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  expensesNotChargedToLL: { type: Number, default: 0 },
});

const Landlord = mongoose.model("Landlord", landlordSchema);

function validateLandlord(landlord) {
  const schema = Joi.object({
    _id: Joi.string().optional(),
    llID: Joi.string().min(1).max(20).required(),
    name: Joi.string().min(1).max(255).required(),
    rentAmount: Joi.number().min(0).max(100000),
    rentPeriodStart: Joi.date(),
    rentPeriodEnd: Joi.date(),
    contractStartDate: Joi.date(),
  });

  return schema.validate(landlord);
}

exports.landlordSchema = landlordSchema;
exports.Landlord = Landlord;
exports.validate = validateLandlord;
