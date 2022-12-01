import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getHotels, getHotelsWithRooms } from "@/controllers";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getHotels)
  .get("/:hotelId", getHotelsWithRooms);

export { bookingRouter };
