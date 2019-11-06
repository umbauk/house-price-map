const mongoose = require('mongoose');
//const moment = require('moment');
const Schema = mongoose.Schema;

let dataImportSchema = new Schema(
  {
    date_of_sale: { type: Date, required: true }, //dd/mm/yyyy
    address: { type: String, required: true },
    postal_code: { type: String },
    ppr_county: { type: String },
    price: { type: Number },
    not_full_market_price: { type: String, enum: ['Yes', 'No'] },
    vat_exclusive: { type: String, enum: ['Yes', 'No'] },
    description_of_property: { type: String },
    property_size_description: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { collection: 'shane_lynn_dump' },
);

module.exports = mongoose.model('DataImport', dataImportSchema);
