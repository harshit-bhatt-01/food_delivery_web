var router = require("express").Router();
var passport = require("passport");
var keys = require("../keys");
var fs = require("fs");
var multer = require("multer");

var states = JSON.parse(fs.readFileSync("states.json").toString());

var storage = multer.diskStorage({
    filename: function(req, file, callback){
      callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function(req, file,cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
      return cb(new Error('Only image file are allowed!'),false);
    }
    cb(null, true);
}
var upload = multer({storage: storage, fileFilter: imageFilter})

var cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: 'foodyz',
  api_key: keys.cloudinary.api_key,
  api_secret: keys.cloudinary.api_secret
});

var customer = require("../models/customer");
var restaurant = require("../models/restaurant");
var food = require("../models/food");

router.get("/login", function(req, res){
    res.render("restaurantLogin");
});

router.post("/login",passport.authenticate("restaurant-local", {
    successRedirect: "/restaurant/home",
    failureRedirect: "/restaurant/login"
}), function(req, res){
});

router.get("/home", function(req, res){
    restaurant.findById(req.user._id, function(err, object){
      if(err){
        console.log(err);
      } else {
        res.redirect("/restaurant/dashboard/" + object._id)
      }
    });
});

router.get("/register", function(req, res){
    res.render("restaurantRegister", {state: states});
});

router.post("/register", function(req, res){
  var city = req.body.city.charAt(0).toUpperCase()+req.body.city.substring(1);
    restaurant.register(new restaurant({
        name: req.body.name,
        address: req.body.address,
        city: city,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        contact: req.body.contact,
        username: req.body.username
    }), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("restaurantRegister");
        }
        passport.authenticate("restaurant-local")(req, res, function(){
            res.redirect("/restaurant/home");
    });
  })
});

router.get("/info/:id", function(req, res){
    restaurant.findById(req.params.id, function(err, foundRestaurant){
      restaurant.findOne({username: foundRestaurant.username}).populate("menu").exec(function(err, found){
          if(err){
            console.log(err);
          }
          res.render("menulist", {menu: found.menu, customer: req.user});
    });
  });
});

router.get("/dashboard/:id",isRestaurantLogin, function(req, res) {
  restaurant.findOne({username: req.user.username}).populate("menu").exec(function(err, found){
      if(err){console.log(err);} else {
      res.render("restaurantdashboard", {user: req.user, menu: found.menu, order: found.order, customer: found.customer});
    }
  });
});

router.get("/dashboard/:id/acceptorder/:customer_id",isRestaurantLogin, function(req, res){
  customer.updateOne({name: req.params.customer_id}, {$set: {orderaccepted: 1}}, function(err, done){
    if(err){console.log(err);}else{
      restaurant.findOne({_id: req.params.id}, function(err, this_rest){
        if(err){console.log(err);}else{
          console.log(this_rest.customer);
          this_rest.customer.forEach(function(cust){
            if(cust != null){
            if(cust.name == req.params.customer_id){
              cust.orderaccepted = 1;
              this_rest.markModified("customer");
              this_rest.save(function(err, data){
                if(err){console.log(err);}else{
                  console.log(data);
                }
              });
              res.redirect("/restaurant/dashboard/" + req.user._id);
            }
            }
          });
          }
      });
    }
  });
});

router.get("/dashboard/:id/foodPrepared/:customer_id",isRestaurantLogin, function(req, res){
  customer.updateOne({name: req.params.customer_id}, {$set: {orderaccepted: 0, foodsent: req.params.id}}, function(err, done){
    if(err){console.log(err);} else {
      res.redirect("/restaurant/dashboard/" + req.user._id);
    }
  })
});

router.get("/dashboard/:id/addfood",isRestaurantLogin, function(req, res){
    res.render("addfood", {currentrestaurant: req.user});
});

router.post("/dashboard/:id/addfood",isRestaurantLogin, function(req, res){
    var count = Object.keys(req.body).length / 5;
    var details = req.body;
    for(var i=1; i<=count; i++){
        var category = 'category'+i,
            title = 'title'+i,
            description = 'description'+i,
            type = 'type'+i,
            price = 'price'+i;
            food.create({
                category: details[category],
                name: details[title],
                image: "",
                price: details[price],
                description: details[description],
                type: details[type]
            }, function(err, newfood){
              if(err){
                console.log(err);
              }
              console.log(newfood);
                restaurant.findOne({username: req.user.username}, function(err, foundRestaurant){
                    if(err){
                      console.log(err);
                    } else {
                      foundRestaurant.menu.push(newfood);
                      foundRestaurant.save(function(err, done){
                          if(err){
                            console.log(err);
                          }else{
                            console.log(done);
                          }
                      });
                    }
                })
            });
    }
    res.redirect("/restaurant/dashboard/" + req.user.id)
});

router.get("/dashboard/:id/edit/:foodid",isRestaurantLogin, function(req, res){
  food.findById(req.params.foodid, function(err, food){
      if(err){
        console.log(err);
      }else{
        res.render("editfood", {currentfood: food, currentrestaurant: req.user});
      }
  });
});

router.put("/dashboard/:id/edit/:foodid",isRestaurantLogin, function(req, res){
    food.findByIdAndUpdate(req.params.foodid, {$set: {
        category: req.body.category,
        name: req.body.title,
        price: req.body.price,
        description: req.body.description,
        type: req.body.type
    }}, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/restaurant/dashboard/" + req.user.id);
        }
    });
});

router.delete("/dashboard/:id/removefood/:foodid",isRestaurantLogin, function(req, res){
    food.findByIdAndRemove(req.params.foodid, function(err){
        if(err){
          res.redirect("back");
        } else {
          restaurant.updateOne({username: req.user.username}, {$pull: {menu: req.params.foodid}}, function(err, data){
              if(err){
                console.log(err);
              } else {
                console.log(data);
                res.redirect("/restaurant/dashboard/" + req.user.id);
              }
          });
        }
    });
});

router.post("/dashboard/:id/uploadImage/:foodid",isRestaurantLogin,upload.single('image'), function(req, res){
  cloudinary.uploader.upload(req.file.path, function(result){
      food.updateOne({_id: req.params.foodid}, {$set: {image: result.secure_url}}, function(err, response){
          if(err){
            console.log(err);
          } else {
            console.log(response);
            res.redirect("/restaurant/dashboard/" + req.params.id);
          }
      });
  });
});

router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/restaurant/login");
});

function isRestaurantLogin(req, res, next){
    if(req.isAuthenticated("restaurant-local")){
        return next();
    }
    res.redirect("/restaurant/login");
}

module.exports = router;
