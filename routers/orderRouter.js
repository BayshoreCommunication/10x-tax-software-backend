const express = require("express");
const orderRouter = express.Router();

const {
  createOrder,
  getUserOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  handlePayment,
} = require("../controllers/orderController");


orderRouter.post("/orders", createOrder);
orderRouter.get("/orders/:userId", getUserOrders);
orderRouter.get("/orders/:id", getSingleOrder);
orderRouter.put("/orders/:id", updateOrder);
orderRouter.delete("/orders/:id", deleteOrder);
orderRouter.post("/orders/payment", handlePayment);

module.exports ={ orderRouter};
