var mongoose = require("mongoose");

var foodSchema = new mongoose.Schema({
    category: String,
    name: String,
    image: String,
    price: Number,
    description: String,
    type: String
});

var Food = mongoose.model("food", foodSchema);

module.exports = Food;
