const User = require("./../models/userModel");
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const nodemailer = require("nodemailer");

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

exports.createInterview = catchAsync(async (req, res, next) => {
  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "amolverma.246@gmail.com",
      pass: "xtrj rsnm guky eqmg",
    },
  });

  // Function to send interview invitations
  async function sendInterviewInvitations(
    jobTitle,
    jobDescription,
    experienceLevel,
    candidateEmails,
    endDate
  ) {
    // Email template
    const emailTemplate = (candidateEmail) => ({
      from: `"${req.user.companyName}" <InterNew@InterNew.com>`,
      to: candidateEmail,
      subject: `Interview Invitation: ${jobTitle} Position`,
      html: `
        <h2>Interview Invitation</h2>
        <p>Dear Candidate,</p>
        <p>We are pleased to invite you for an interview for the position of <strong>${jobTitle}</strong>.</p>
        <h3>Job Details:</h3>
        <ul>
          <li><strong>Job Title:</strong> ${jobTitle}</li>
          <li><strong>Experience Level:</strong> ${experienceLevel}</li>
          <li><strong>Job Description:</strong> ${jobDescription}</li>
        </ul>
        <p><strong>Please note:</strong> This invitation is valid until ${endDate}. After this date, we may not be able to consider your application.</p>
        <p>If you're interested in this opportunity, please reply to this email with your preferred date and time for the interview.</p>
        <p>We look forward to speaking with you!</p>
        <p>Best regards,<br>HR Team<br>${req.user.companyName}</p>
      `,
    });

    const results = [];
    // Send emails to all candidates
    for (const email of candidateEmails) {
      try {
        const info = await transporter.sendMail(emailTemplate(email));
        results.push({ email, status: "success", messageId: info.messageId });
        console.log(`Email sent to ${email}: ${info.messageId}`);
      } catch (error) {
        results.push({ email, status: "failed", error: error.message });
        console.error(`Failed to send email to ${email}:`, error);
      }
    }
    return results;
  }

  var { jobTitle, jobDescription, experienceLevel, candidateEmails, endDate } =
    req.body;

  // Example usage (you should get these values from req.body in a real application)
  jobTitle = jobTitle || "Senior Software Developer";
  jobDescription =
    jobDescription ||
    "We are seeking an experienced software developer proficient in Node.js and React to join our dynamic team.";
  experienceLevel = experienceLevel || "5+ years";
  candidateEmails = candidateEmails || [
    "devankitanand@gmail.com",
    // "candidate2@example.com",
    // "candidate3@example.com",
  ];
  endDate = endDate || "June 30, 2024";

  const results = await sendInterviewInvitations(
    jobTitle,
    jobDescription,
    experienceLevel,
    candidateEmails,
    endDate
  );

  res.status(200).json({
    status: "success",
    message: "Email sending process completed",
    results: results,
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
