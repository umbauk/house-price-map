const mongoose = require('mongoose');
//const moment = require('moment');
const Schema = mongoose.Schema;

let HouseSchema = new Schema(
  {
    date_of_sale: { type: String, required: true }, //dd/mm/yyyy
    address: { type: String, required: true },
    postal_code: { type: String },
    county: { type: String },
    price: { type: Number },
    not_full_market_price: { type: String, enum: ['Yes', 'No'] },
    vat_exclusive: { type: String, enum: ['Yes', 'No'] },
    description_of_property: { type: String },
    property_size_description: { type: String },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  { collection: 'dublin_flattened' },
);

HouseSchema.virtual('estimated_current_price').get(function() {
  return this.price; // this.price * price index for this.date_of_sale month/year
});

module.exports = mongoose.model('House', HouseSchema);
