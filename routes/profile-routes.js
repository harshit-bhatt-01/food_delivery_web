var router = require("express").Router();
var customer = require("../models/customer");
var restaurant = require("../models/restaurant");
var food = require("../models/food");
var request = require("request");
var fs = require("fs");

var states = JSON.parse(fs.readFileSync("states.json").toString());

router.get("/customerlogout", function (req, res) {
  req.logout();
  res.redirect("/");
});

router.post("/update", function (req, res) {
  var city = req.body.city.charAt(0).toUpperCase() + req.body.city.substring(1);
  customer.updateOne({ googleid: req.user.googleid },
    {
      $set: {
        houseNo: req.body.houseno,
        address: req.body.address,
        city: city,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        contact: req.body.contact
      }
    }, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });

  customer.findById(req.user._id, function (err, object) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/profile/" + object._id);
    }
  });
  // res.redirect("/profile");
});

router.get("/register", function (req, res) {
  res.render("details", { state: states });
});

function isCustomerAuthenticated(req, res, next) {
  if (req.isAuthenticated("google")) {
    return next();
  }
  res.redirect("/");
}

router.get("/:id", isCustomerAuthenticated, function (req, res) {
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    restaurant.find({ name: regex, city: req.user.city }, function (err, searchedRestaurant) {
      if (err) {
        console.log(err);
      } else {
        res.render("customerdashboard", { customer: req.user, restaurant: searchedRestaurant });
      }
    })
  } else {
    restaurant.find({ city: req.user.city }, function (err, foundRestaurant) {
      if (err) {
        console.log(err);
      } else {
        res.render("customerdashboard", { customer: req.user, restaurant: foundRestaurant });
      }
    })
  }
});

router.get("/:id/cart", isCustomerAuthenticated, function (req, res) {
  customer.findOne({ _id: req.params.id }).populate("cart.food").exec(function (err, cart) {
    if (err) {
      console.log(err);
    } else {
      var total = 0;
      cart.cart.forEach(function (item) {
        total = total + (parseInt(JSON.stringify(item.food.price)) * parseInt(JSON.stringify(item.quantity)));
      });
      res.render("cart", { customer: req.user, cart: cart, total: total });
    }
  })
});

router.get("/:id/orderReceived", isCustomerAuthenticated, function (req, res) {
  restaurant.findOne({ _id: req.user.foodsent }, function (err, rest_data) {
    if (err) { console.log(err); } else {
      console.log(rest_data.customer);
      for (var i = 0; i < rest_data.customer.length; i++) {
        if (rest_data.customer[i] != null) {
          if (rest_data.customer[i].contact == req.user.contact) {
            rest_data.customer.splice(i, 1);
            rest_data.markModified("customer");
            rest_data.order.splice(i, 1);
            rest_data.markModified("order");
            rest_data.save();
          }
        }
      }
      customer.updateOne({ _id: req.params.id }, { $set: { orderaccepted: 0, foodsent: "" } }, function (err, done) {
        if (err) { console.log(err); } else {
          res.redirect("/profile/" + req.user._id)
        }
      })
    }
  })
});

router.post("/:id/checkout", isCustomerAuthenticated, function (req, res) {
  var total = req.body.total;
  res.render("checkout", { payment: total, orderid: req.params.id });
});

router.post("/:id/cart/remove/:item", isCustomerAuthenticated, function (req, res) {
  customer.findByIdAndUpdate(req.params.id, { $pull: { cart: { food: req.params.item } } }, function (err, response) {
    if (err) {
      console.log(err);
    } else {
      customer.findById(req.params.id, function (err, currentCustomer) {
        if (err) {
          console.log(err);
        } else {
          if (currentCustomer.cart.length == 0) {
            customer.updateOne({ _id: req.params.id }, { $set: { restaurant: "" } }, function (err, done) {
              if (err) {
                console.log(err);
              } else {
                console.log(done);
              }
            })
          }
          res.redirect("back");
        }
      })
    }
  });
});


router.post("/:id/checkout/orderConfirmation", isCustomerAuthenticated, function (req, res) {
  curr_food = [];
  customer.findOne({ _id: req.params.id }, function (err, curr_customer) {
    var rest = curr_customer.restaurant;
    for (var i = 0; i < curr_customer.cart.length; i++) {
      var quantity = curr_customer.cart[i].quantity;
      food.findOne({ _id: curr_customer.cart[i].food }, function (err, data) {
        if (err) { console.log(err); } else {
          curr_food.push({ food: data, quantity: quantity });
        }
      });
    }

    customer.updateOne({ _id: req.params.id }, { $set: { cart: [], restaurant: "" } }, function (err, currentCustomer) {
      if (err) {
        console.log(err);
      } else {
        console.log(curr_food);
        restaurant.updateOne({ _id: rest },
          { $push: { order: curr_food, customer: { orderaccepted: curr_customer.orderaccepted, name: curr_customer.name, address: curr_customer.address, contact: curr_customer.contact } } },
          function (err, done) {
            if (err) { console.log(err); } else {
              res.redirect("/profile/" + req.params.id);
            }
          })
      }
    });
  });
});

router.get("/:id/menulist/:restaurantid", isCustomerAuthenticated, function (req, res) {
  restaurant.findById(req.params.restaurantid).populate("menu").exec(function (err, found) {
    if (err) {
      console.log(err);
    } else {
      res.render("menulist", { customer: req.user, menu: found.menu, restaurantid: req.params.restaurantid });
    }
  })
});

router.post("/:id/menulist/:restaurantid/addtocart/:foodid", isCustomerAuthenticated, function (req, res) {
  customer.findById(req.params.id, function (err, currentCustomer) {
    if (err) {
      console.log(err);
    } else {
      food.findById(req.params.foodid, function (err, selectedFood) {
        if (err) {
          console.log(err);
        } else {
          var food = { food: selectedFood, quantity: req.body.quantity };

          if (currentCustomer.cart.length == 0) {
            customer.updateOne({ _id: req.params.id }, { $set: { restaurant: req.params.restaurantid } }, function (err, done) {
              if (err) {
                console.log(err);
              } else {
                console.log(done);
              }
            })
            currentCustomer.cart.push(food);
            currentCustomer.save(function (err, done) {
              if (err) {
                console.log(err);
              } else {
                res.redirect("/profile/" + req.params.id + "/menulist/" + req.params.restaurantid);
              }
            })
          }
          else {
            if (JSON.stringify(currentCustomer.restaurant) == JSON.stringify(req.params.restaurantid)) {
              currentCustomer.cart.forEach(function (eachItem) {
                if ((JSON.stringify(eachItem.food) == JSON.stringify(selectedFood._id)) == false) {
                  currentCustomer.cart.push(food);
                  currentCustomer.save(function (err, done) {
                    if (err) {
                      console.log(err);
                    } else {
                      res.redirect("/profile/" + req.params.id + "/menulist/" + req.params.restaurantid);
                    }
                  })
                } else {
                  console.log("already present in cart");
                  res.redirect("/profile/" + req.params.id + "/menulist/" + req.params.restaurantid);
                }
              });
            } else {
              console.log("One restaurant's food at a time.");
              res.redirect("/profile/" + req.params.id + "/menulist/" + req.params.restaurantid);
            }
          }
        }
      })
    }
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
