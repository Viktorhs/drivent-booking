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

const bookingRepository = {
  findUserBooking,
  findRoomById,
  findBookingsByRoomId,
  createBooking
};

export default bookingRepository;
