import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join a room for video consultation
      socket.on('join-room', (roomId: string) => {
        const room = io?.sockets.adapter.rooms.get(roomId);
        const isRoomFull = room && room.size >= 2;

        if (isRoomFull) {
          socket.emit('room-full');
          return;
        }

        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('user-connected', socket.id);

        // If room has 2 people, notify both that call can start
        if (room && room.size === 2) {
          io?.to(roomId).emit('call-ready');
        }
      });

      // WebRTC signaling: Offer
      socket.on('offer', ({ roomId, offer }) => {
        socket.to(roomId).emit('offer', { offer, callerId: socket.id });
      });

      // WebRTC signaling: Answer
      socket.on('answer', ({ roomId, answer }) => {
        socket.to(roomId).emit('answer', { answer, calleeId: socket.id });
      });

      // WebRTC signaling: ICE candidates
      socket.on('ice-candidate', ({ roomId, candidate }) => {
        socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
      });

      // Handle user leaving
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user-disconnected', socket.id);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
  return io;
};

export const getIO = () => io;

export default initializeSocket;
