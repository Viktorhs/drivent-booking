import bookingRepository  from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { notFoundError, requestError, unauthorizedError } from "@/errors";

async function getBookings(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const booking = await bookingRepository.findUserBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

async function verifyUserTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw requestError(403, "Invalid");
  }
}

async function postBooking(userId: number, roomId: number) {
  await verifyUserTicket(userId);
  const isValidRoom = await bookingRepository.findRoomById(roomId);
  const isBooking = await bookingRepository.findUserBooking(userId);

  if (!isValidRoom) {
    throw notFoundError();
  }
  const totalBookingsInRoom = await bookingRepository.findBookingsByRoomId(roomId);

  if(totalBookingsInRoom.length >= isValidRoom.capacity || isBooking) {
    throw requestError(403, "Invalid");
  }

  const booking = await bookingRepository.createBooking(userId, roomId);
  return { bookingId: booking.id };
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
  await verifyUserTicket(userId);
  const isValidRoom = await bookingRepository.findRoomById(roomId);
  const isBooking = await bookingRepository.findBookingById(bookingId);

  if (!isValidRoom || !isBooking) {
    throw notFoundError();
  }
  if (Number(isBooking.userId) !== userId) {
    throw unauthorizedError();
  }
  const totalBookingsInRoom = await bookingRepository.findBookingsByRoomId(roomId);

  if(totalBookingsInRoom.length >= isValidRoom.capacity || Number(isBooking.roomId) === roomId) {
    throw requestError(403, "Invalid");
  }

  const booking = await bookingRepository.updateBookingUser(bookingId, roomId);
  return { bookingId: booking.id };
}

const bookingService = {
  getBookings,
  postBooking,
  putBooking
};

export default bookingService;
