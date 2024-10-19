const express = require("express");
const userController = require("./../controllers/userController.js");
const authController = require("./../controllers/authController.js");
const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

router.use(authController.protect);
router.route("/createInterview").post(userController.createInterview);

router.delete("/deleteMe", userController.deleteMe);

router.route("/updateMyPassword").patch(authController.updatePassword);

router.get(
  "/me",

  userController.getMe,
  userController.getUser
);

router.use(authController.restrictTo("admin"));
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
