import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getUniqueBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const bookings = await bookingService.getBookings(Number(userId));
    return res.status(httpStatus.OK).send(bookings);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export async function postUserBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  if( !roomId ) {
    return res.sendStatus(404);
  }

  try {
    const booking = await bookingService.postBooking(Number(userId), Number(roomId));

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "CannotListHotelsError" || error.name === "Room is full") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}

export async function putUserBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const { bookingId } = req.params;

  if( !roomId ) {
    return res.sendStatus(404);
  }

  try {
    const booking = await bookingService.putBooking(Number(userId), Number(roomId), Number(bookingId));

    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "CannotListHotelsError" || error.name === "Room is full") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
  }
}
