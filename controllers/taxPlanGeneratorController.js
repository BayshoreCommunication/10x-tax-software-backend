const TaxPlanGenerator = require("../models/taxPlanGeneratorModel");
const createError = require("http-errors");
const { successResponse } = require("./responseController");
const sendEmailWithNodeMailer = require("../helper/email");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");
const { smptUser, smptPassword } = require("../secret");
const sendProposalEmail = require("../helper/sendProposalEmail");
const ProposalSend = require("../models/proposalSendModel");
const sendTaxProposalTemplate = async (email, imageUrl, clientName) => {


  const emailData = {
    email,
    subject: "10x Tax Proposal",
    html: `
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 15px;">
        <div style="max-width: 1280px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <div style="padding: 30px; text-align: center;">
            <h1 style="font-size: 24px; color: #333333; margin: 0 0 20px;">Hello ${clientName}!</h1>
            <p style="font-size: 16px; color: #555555; line-height: 1.5; margin: 0 0 20px;">
              We have received a sign-up attempt for your account. Use the verification code below to complete your registration:
            </p>
            <img src="${imageUrl}" alt="Uploaded Image" style="max-width: 100%; border-radius: 8px; margin-top: 20px;" />
          </div>
          <div style="text-align: center; font-size: 12px; color: #888888; margin-top: 20px; padding: 10px;">
            If you did not attempt to register, please ignore this email.
          </div>
        </div>
      </body>
    `,
  };

  try {
    await sendEmailWithNodeMailer(emailData); // Ensure this function handles errors internally
  } catch (error) {
    throw new Error('Failed to send verification email');
  }
};





const createTaxPlan = async (req, res, next) => {
  try {

    const userId = req.user._id;

    const { clientId, taxInfo } = req.body;

    const newTaxPlan = new TaxPlanGenerator({
      userId,
      clientId,
      taxInfo
    });

    await newTaxPlan.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan generated successfully",
      payload: {newTaxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create tax plan."));
  }
};

const getTaxPlanByUserId = async (req, res, next) => {
  try {
    const { id: clientId } = req.params;

    const taxPlan = await TaxPlanGenerator.find({ clientId });
    if (!taxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan retrieved successfully",
      payload: {taxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to retrieve tax plan."));
  }
};

const updateTaxPlan = async (req, res, next) => {
  try {
    const { id: _id } = req.params;
    const updateData = req.body;

    const updatedTaxPlan = await TaxPlanGenerator.findOneAndUpdate(
      { _id },
      updateData,
      { new: true }
    );
    if (!updatedTaxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan updated successfully",
      payload: {updatedTaxPlan}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to update tax plan."));
  }
};

const deleteTaxPlan = async (req, res, next) => {
  try {
    const { id: _id } = req.params;

    const deletedTaxPlan = await TaxPlanGenerator.findOneAndDelete({  _id });
    if (!deletedTaxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Tax plan deleted successfully",
      payload: {}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to delete tax plan."));
  }
};



const sendTaxProposal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const userId = req.user._id;

    const {email, clientName, clientId} = req.body;

    const emailData = {email: email, subject: "This is 10x Tax Proposal", text: "This is your tax proposal body content just for testing..."}
  
    await sendProposalEmail(emailData, req.file)

    const proposalRecord = new ProposalSend({
      userId,
      clientId,
      clientName,
      clientEmail: email,
    });

    await proposalRecord.save();


    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });


    return successResponse(res, {
      statusCode: 200,
      message: "Tax proposal send successfully",
      payload: {}
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to send tax proposal."));
  }
};

const getProposalSend = async (req, res, next) => {
  try {
    const userId = req.user._id; 

    const proposalSendList = await ProposalSend.find({ userId }); 

    if (!proposalSendList || proposalSendList.length === 0) {
      throw createError(404, "No proposals found for this user.");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Proposal send list fetched successfully.",
      payload: { proposalSendList },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to send tax proposal."));
  }
};


module.exports = {
  createTaxPlan,
  getTaxPlanByUserId,
  updateTaxPlan,
  deleteTaxPlan,
  sendTaxProposal,
  getProposalSend
};


