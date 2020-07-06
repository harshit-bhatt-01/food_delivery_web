var express = require("express"),
	app = express(),
	bodyparser=require("body-parser"),
	passport=require("passport"),
	localstrategy=require("passport-local"),
	mongoose=require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose"),
	googleStrategy = require("passport-google-oauth20"),
	keys = require("./keys"),
	methodOverride = require("method-override"),
	messagebird = require("messagebird")("IaxoJGl8RXuxJI6M3BkAJql7a");
	var fs = require("fs");

	var states = JSON.parse(fs.readFileSync("states.json").toString());

app.use(methodOverride("_method"));

var authRoutes = require("./routes/auth-routes"),
		profileRoutes = require("./routes/profile-routes"),
		restaurantRoutes = require("./routes/restaurant-routes");

var customer = require("./models/customer");
var restaurant = require("./models/restaurant");

app.listen(8080, function(){
	console.log("Listening on port: " + this.address().port);
});

app.use(require("express-session")({
    secret: "VIT",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
		new googleStrategy({
				callbackURL: '/auth/google/redirect',
				clientID: keys.google.clientID,
				clientSecret: keys.google.clientSecret
			}, function(accessToken, refreshToken, profile, done){

		// check if user already exist
						customer.findOne({googleid: profile.id}, function(err, data){
								if(err){
								console.log(err);
								} else if(data){
										app.locals.new = false;
										done(null, data);
									} else {
											new customer({
													googleid: profile.id,
													name: profile.displayName,
													email: profile.emails[0].value,
													address: "",
													state: "",
													district: "",
													pincode: "",
													contact: "",
													restaurant: "",
													orderaccepted: 0,
													foodsent: ""
											}).save().then(function(newUser){
													app.locals.new = true;
													done(null, newUser);
												});
										}
						});
		})
);

passport.use("restaurant-local", new localstrategy(restaurant.authenticate()));

mongoose.connect("mongodb://localhost:27017/foodDelivery",{useNewUrlParser: true,});
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/restaurant', restaurantRoutes);

// serializing user
passport.serializeUser(function(id, done){
	customer.findById(id).then(function(user){
		if(user){
				done(null, user);
		} else {
				restaurant.findById(id).then(function(user){
					done(null, user);
				});
			}
	});
});

// deserializing user
passport.deserializeUser(function(id, done){
	customer.findById(id).then(function(user){
		if(user){
				done(null, user);
		} else {
				restaurant.findById(id).then(function(user){
					done(null, user);
				});
		}
	});
});

app.get("/", function(req, res){
		res.render("home", {state: states});
});

app.get("/search/home", function(req, res){
	var searchedCity = req.query.city.charAt(0).toUpperCase()+req.query.city.substring(1);
		restaurant.find({city: searchedCity}, function(err, restaurants){
				if(err){
					console.log(err);
				} else {
					res.render("landing",{customer: req.user, location: searchedCity, restaurant: restaurants});
				}
		});
});
