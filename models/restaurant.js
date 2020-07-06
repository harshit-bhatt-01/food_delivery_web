var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var restaurantSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    state: String,
    district: String,
    pincode: Number,
    contact: Number,
    username: {type: String, unique: true},

    menu: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "food"
    }],

    order: [Array],
    customer: [Object]
});

restaurantSchema.plugin(passportLocalMongoose);
var Restaurant = mongoose.model("restaurant", restaurantSchema);

module.exports = Restaurant;
