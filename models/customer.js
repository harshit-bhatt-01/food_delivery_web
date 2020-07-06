var mongoose = require("mongoose");

var customerSchema = new mongoose.Schema({
	googleid: String,
	name: String,
	email: String,
	address: String,
	city: String,
	state: String,
	district: String,
	pincode: Number,
	contact: Number,
	cart: [{
			food: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'food'
		},
		quantity: Number
	}
],
restaurant: String,
orderaccepted: Number,
foodsent: String
});

var Customer = mongoose.model("customer", customerSchema);

module.exports = Customer;
