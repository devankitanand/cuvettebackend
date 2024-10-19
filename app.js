const path = require("path");
const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const crypto = require("crypto");
const fs = require("fs");
const morgan = require("morgan");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const port = 3000;
const compression = require("compression");
// const viewRouter = require("./routes/viewRoutes.js");
const cookieParser = require("cookie-parser");

// const tourRouter = require("./routes/tourRoutes.js");
const userRouter = require("./routes/userRoutes.js");
// const reviewRouter = require("./routes/reviewRoutes.js");
// const bookingRouter = require("./routes/bookingRoutes.js");

const cors = require("cors");
const AppError = require("./utils/appError");
app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//1)Global Middlewares
//Implementing CORS
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET" , "POST" , "PUT", "DELETE" , "OPTIONS"],
    allowedHeaders: ["Content-Type" , "Authorization" , "authorization"],
    optionsSuccessStatus:204,
  })
);
//app.use(cors({
// origin: 'https://www.natours.com'
//}))
// app.options("*", cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
//Rate limiter ,limits request from same Api
const limiter = rateLimit({
  max: 100000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP ,please try in an hour !",
});

app.use("/api", limiter);

//Body parser
app.use(express.json());
app.use(cookieParser());
//Data sanitization against No sql query injection
app.use(mongoSanitize());
//XSS prevention'
app.use(xss());
//Helmet , sets Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }));

//Parameter prevention
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
//Serving static files
app.use(express.static(path.join(__dirname, "/starter/public")));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
//Test Middleware
app.use((req, res, next) => {
  // console.log("Hello from the middleware");
  next();
});
app.use(compression());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

const otpStore = new Map();

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "amolverma.246@gmail.com",
    pass: "xtrj rsnm guky eqmg",
  },
});

// Twilio client setup
const twilioClient = twilio(
  "AC8b7285462ef3aae28747e56a1089e78f",
  "8b6bdb5ef0f12b657485fc46ca5bb63b"
);

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

app.post("/send-otp", async (req, res) => {
  const { method, destination } = req.body;
  const otp = generateOTP();
  otpStore.set(destination, otp);

  try {
    if (method === "email") {
      await transporter.sendMail({
        from: "amolverma.246@gmail.com",
        to: destination,
        subject: "Your OTP",
        text: `Your OTP is: ${otp}`,
      });
    } else if (method === "sms") {
      await twilioClient.messages.create({
        body: `Your OTP is: ${otp}`,
        from: "+18585003413",
        to: destination,
      });
    } else {
      return res.status(400).json({ error: "Invalid method" });
    }
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { destination, otp } = req.body;
  const storedOTP = otpStore.get(destination);

  if (storedOTP && storedOTP === otp) {
    otpStore.delete(destination);
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ error: "Invalid OTP" });
  }
});

// 3)ROUTES
// app.use("/", viewRouter);

// app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
// app.use("/api/v1/reviews", reviewRouter);
// app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
