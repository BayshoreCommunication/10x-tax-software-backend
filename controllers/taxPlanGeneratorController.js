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
      <div style="max-width: 720px; margin: 30px auto; background: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
        
        <div style="padding: 30px; text-align: left;">
          <h1 style="font-size: 24px; color: #333333; margin-bottom: 20px;">Hello ${clientName},</h1>
          
          <p style="font-size: 16px; color: #555555; line-height: 1.6;">
            We are pleased to share with you your personalized <strong>Tax Proposal</strong>. It includes details tailored to your business or individual profile, outlining the suggested services and estimated costs.
          </p>
          
          <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
            If you have any questions, feedback, or need changes, please feel free to contact us. We’re here to help you every step of the way.
          </p>
          
          <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-top: 20px;">
            Thank you for choosing our services.
          </p>
  
          <p style="font-size: 16px; color: #333333; margin-top: 30px;">
            Best regards,<br/>
            The 10x Tax Team
          </p>
        </div>
  
        <div style="text-align: center; font-size: 12px; color: #888888; background-color: #f0f0f0; padding: 12px;">
          This proposal email is confidential and intended solely for ${clientName}. If you received it in error, please disregard or contact our support.
        </div>
      </div>
    </body>
  `,
  };

  try {
    await sendEmailWithNodeMailer(emailData);
  } catch (error) {
    throw new Error("Failed to send verification email");
  }
};

// Create tax plan and proposal

const createTaxPlan = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const { clientId, taxInfo, taxProposalInfo } = req.body;

    const newTaxPlan = new TaxPlanGenerator({
      userId,
      clientId,
      taxInfo,
      taxProposalInfo,
    });

    await newTaxPlan.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Tax plan generated successfully",
      payload: { newTaxPlan },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to create tax plan."));
  }
};

// Get tax plan and  proposal data

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
      payload: { taxPlan },
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
      payload: { updatedTaxPlan },
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to update tax plan."));
  }
};

// Deleted tax plan and proposal data

const deleteTaxPlan = async (req, res, next) => {
  try {
    const { id: _id } = req.params;

    const deletedTaxPlan = await TaxPlanGenerator.findOneAndDelete({ _id });
    if (!deletedTaxPlan) {
      return next(createError(404, "Tax plan not found."));
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Tax plan deleted successfully",
      payload: {},
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to delete tax plan."));
  }
};

// Send tax proposal

const sendTaxProposal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    const userId = req.user._id;

    const { email, clientName, clientId } = req.body;

    const emailData = {
      email: email,
      subject: "This is 10x Tax Proposal",
      text: "This is your tax proposal body content just for testing...",
      clientName: clientName,
    };

    await sendProposalEmail(emailData, req.file);

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
      payload: {},
    });
  } catch (error) {
    next(createError(500, error.message || "Failed to send tax proposal."));
  }
};

// Get send tax proposal data

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
  getProposalSend,
};
