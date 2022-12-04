import { prisma } from "@/config";

async function findUserBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId
    },
    include: {
      Room: true
    }
  });
}

async function findRoomById(id: number) {
  return prisma.room.findFirst({
    where: {
      id: id,
    }
  });
}

async function findBookingsByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId: roomId
    }
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId
    }
  });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findUnique({
    where: {
      id: bookingId
    }
  });
}

async function updateBookingUser(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      roomId
    }
  });
}

const bookingRepository = {
  findUserBooking,
  findRoomById,
  findBookingsByRoomId,
  createBooking,
  findBookingById,
  updateBookingUser
};

export default bookingRepository;
