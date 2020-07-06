var router = require("express").Router();
var passport = require("passport");
var customer = require("../models/customer");
var messagebird = require("messagebird")("IaxoJGl8RXuxJI6M3BkAJql7a");

router.get("/login", function(req, res){
	res.render("customerlogin");
});

router.get("/logout", function(req, res){
	res.send("Logging out");
});

router.get("/google", passport.authenticate("google", {
	scope: ["profile","email"]
}));

router.get('/google/redirect', passport.authenticate("google"), function(req, res){
	if(req.app.locals.new){
		res.redirect("/profile/register");
	} else {
		customer.findById(req.user._id, function(err, object){
			if(err){
				console.log(err);
			} else {
				res.redirect("/profile/" + object._id);
			}
		});
	}
});

// router.post("/mobile", function(req, res){
// 		var mobile = req.body.mobile;
// 		messagebird.verify.create(mobile, {template: "Your Verification Code for Foodyz is %token"}, function(err, response){
// 				if(err){
// 						console.log(err);
// 				} else {
// 						console.log(response);
// 						res.render("mobileverification", {id: response.id});
// 				}
// 		});
// });
//
// router.post("/mobile/codeverification", function(req, res){
// 		var id = req.body.id,
// 				token = req.body.token;
// 		messagebird.verify.verify(id, token, function(err, response){
// 				if(err){
// 						console.log(err);
// 						res.redirect("/auth/login");
// 				} else {
// 						res.send("Succcesfully verified the customer");
// 				}
// 		});
// });

module.exports = router;
