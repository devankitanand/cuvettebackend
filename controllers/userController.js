const User = require("./../models/userModel");
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_BUCKET_REGION,
});

const uploadToS3 = (bucketName) =>
  multer({
    storage: multerS3({
      s3: s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        //Produce Dynamic File names here instead of image.jpeg
        cb(null, `DingImages-${Date.now()}.${file.mimetype.split("/")[1]}`);
      },
      contentType: function (req, file, cb) {
        cb(null, file.mimetype);
      },
    }),
  });
exports.uploadPostFilesArray = [
  uploadToS3("acdpostpictures").array("postfiles", 5),
];

exports.postFilesUpload = catchAsync(async (req, res, next) => {
  console.log(req.files);

  let files = [];
  let images = [];
  for (const uploadedfile of req.files) {
    if (uploadedfile.mimetype === "application/pdf") {
      files.push(uploadedfile.location);
    } else if (uploadedfile.mimetype.split("/")[0] === "image") {
      images.push(uploadedfile.location);
    }
  }

  const user = await User.findOne(req.user);
  for (const uploadedImage of images) {
    user.image.unshift(uploadedImage);
  }

  user.save();

  console.log(user);
  // console.log(images, files);
  res.status(200).json(user);
  // res.status(200).json({ status: "success", data: { images, files } });
});

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`starter/public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1) Crete error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password .Please use /updateMyPassword",
        400
      )
    );
  }
  //2) Filter out the fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  //3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // console.log(req.user);

  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined.Please use signup instead",
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
