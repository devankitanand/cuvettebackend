// const Tour = require("../models/tourModel.js");
const User = require("../models/userModel.js");
// const Booking = require("../models/bookingModel.js");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  if (req.user) {
    res.redirect("/my-images");
  } else {
    res.redirect("/login");
  }
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render("account", {
    title: "Your Account",
  });
});

exports.getMyImages = catchAsync(async (req, res, next) => {
  //1) Find all Bookings
  const user = await User.find({ _id: req.user.id });

  console.log(user);

  console.log(user[0].image);
  res.status(200).render("overview", {
    title: "My Images",
    images: user[0].image,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
});

exports.getSignupForm = catchAsync(async (req, res) => {
  res.status(200).render("signup", {
    title: "Signup your account",
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );
  res.status(200).render("account", {
    title: "Your Account",
    user: updatedUser,
  });
});

exports.alerts = catchAsync(async (req, res, next) => {
  const { alert } = req.query;
  if (alert === "booking") {
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation .If your booking doesnt show up here immediately, please come back later";
  }
  next();
});
