const express = require("express");
const clientDetialsRouter = express.Router();
const { isLoggedIn } = require("../middleware/auth");


const { createClientDetails, updateClientDetails, deleteClientDetails, getClientsDetailsByUserId, getClientDetailsById } = require("../controllers/clientDetailsController");


clientDetialsRouter.post("/client-details", isLoggedIn, createClientDetails);
clientDetialsRouter.get("/all-client-details", isLoggedIn, getClientsDetailsByUserId);
clientDetialsRouter.get("/client-details/:id", isLoggedIn, getClientDetailsById);
clientDetialsRouter.put("/client-details/:id", isLoggedIn, updateClientDetails);
clientDetialsRouter.delete("/client-details/:id",isLoggedIn, deleteClientDetails);


module.exports = clientDetialsRouter;
