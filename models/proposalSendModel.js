const { Schema, model } = require("mongoose");

const proposalSendSchema = new Schema(
  {
    proposalNumber: {
      type: Number,
      default: 0, 
    },
    userId: {
      type: String,
      required: true, 
    },
    clientId: {
      type: String,
      required: true, 
    },
    clientName: {
      type: String,
      default: "Demo name", 
    },
    clientEmail: {
      type: String,
      required: true, 
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address", 
      ],
    },
  },
  {
    timestamps: true, 
  }
);

const ProposalSend = model("ProposalSend", proposalSendSchema);

module.exports = ProposalSend;
