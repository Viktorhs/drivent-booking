import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getUniqueBooking, postUserBooking } from "@/controllers";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getUniqueBooking)
  .post("/", postUserBooking)
  .put("/:bookingId", getUniqueBooking);

export { bookingRouter };
