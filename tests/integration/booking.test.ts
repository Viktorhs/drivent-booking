import { prisma } from "@/config";
import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createPayment,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
  createRoomWithHotelIdFullCapacity,
  createTicketTypeNoWithHotel,
  createBooking
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and a list of booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual(
        {
          id: createdBooking.id,
          userId: user.id,
          roomId: createdHotelRooms.id,
          createdAt: createdBooking.createdAt.toISOString(),
          updatedAt: createdBooking.updatedAt.toISOString(),
          Room: {
            ...createdHotelRooms,
            createdAt: createdHotelRooms.createdAt.toISOString(),
            updatedAt: createdHotelRooms.updatedAt.toISOString()
          }
        }
      );
    });

    it("should respond with status 404 and an empty array", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  describe("when token is valid", () => {
    it("should respond with status 404 when no have body", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when user ticket is remote ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const body = { roomId: 1 };
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when user ticket no include hotel ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeNoWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
  
      const body = { roomId: 1 };
        
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when user ticket is RESERVED ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const payment = await createPayment(ticket.id, ticketType.price);
  
      const body = { roomId: 1 };
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when user don't have ticket ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
  
      const body = { roomId: 1 };
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
  
    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
  
      const body = { roomId: 1 };
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 404 when RoomId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);

      const body = { roomId: createdHotelRooms.id + 1 };
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when room is full capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelIdFullCapacity(createdHotel.id);
  
      const body = { roomId: createdHotelRooms.id };
    
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
        
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });

    it("should respond with status 403 when user have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
    
      const body = { roomId: createdHotelRooms.id };
      
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
          
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });

    it("should respond with status 200 when user create a valid booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      
      const body = { roomId: createdHotelRooms.id };
        
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      const compare = await prisma.booking.findFirst({
        where: {
          userId: user.id
        }
      });
            
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: compare.id });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/0");
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    
    const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
    const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
    
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
    
  describe("when token is valid", () => {
    it("should respond with status 404 when no have body", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
    
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when user ticket is remote ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
  
      const body = { roomId: 1 };
    
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);
    
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when user ticket no include hotel ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeNoWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
    
      const body = { roomId: 1 };
          
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);
      
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when user ticket is RESERVED ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const payment = await createPayment(ticket.id, ticketType.price);
    
      const body = { roomId: 1 };
    
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);
      
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when user don't have ticket ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
    
      const body = { roomId: 1 };
    
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);
      
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
    
      const body = { roomId: 1 };
    
      const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);
    
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });
    
    it("should respond with status 404 when RoomId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
  
      const body = { roomId: createdHotelRooms.id + 1 };
    
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
        
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 404 when BookingId is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
    
      const body = { roomId: createdHotelRooms.id };
      
      const response = await server.put(`/booking/${createdBooking.id + 1}`).set("Authorization", `Bearer ${token}`).send(body);
          
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 401 when booking is not from the user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const otherUser = await createUser();
      const createdBooking = await createBooking(createdHotelRooms.id, otherUser.id);
      
      const body = { roomId: createdHotelRooms.id };
        
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
            
      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when room is full capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdHotelRoomsOther = await createRoomWithHotelIdFullCapacity(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
    
      const body = { roomId: createdHotelRoomsOther.id };
      
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
          
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 403 when user switch to the same room", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
      
      const body = { roomId: createdHotelRooms.id };
        
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
            
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      expect(response.body).toEqual({});
    });
  
    it("should respond with status 200 when user create a valid booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdHotelRooms = await createRoomWithHotelId(createdHotel.id);
      const createdHotelRoomsOther = await createRoomWithHotelId(createdHotel.id);
      const createdBooking = await createBooking(createdHotelRooms.id, user.id);
        
      const body = { roomId: createdHotelRoomsOther.id };
          
      const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      const compare = await prisma.booking.findFirst({
        where: {
          userId: user.id
        }
      });
              
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: compare.id });
    });
  });
});
