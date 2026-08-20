import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  if (!io) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    io = new SocketIOServer(server, {
      cors: {
        origin: appUrl
          ? [appUrl, "http://localhost:3000", "http://localhost:3001"]
          : true,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
      socket.on("join-room", (payload: string | { roomId: string; name?: string; role?: string }) => {
        const roomId = typeof payload === "string" ? payload : payload?.roomId;
        const name = typeof payload === "object" ? payload?.name : "";
        const role = typeof payload === "object" ? payload?.role : "";
        if (!roomId) return;

        const room = io?.sockets.adapter.rooms.get(roomId);
        if (room && room.size >= 4) {
          socket.emit("room-full");
          return;
        }

        socket.data.roomId = roomId;
        socket.data.name = name;
        socket.data.role = role;
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", { socketId: socket.id, name, role });

        const size = io?.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (size >= 2) {
          io?.to(roomId).emit("call-ready");
        }
      });

      socket.on("offer", ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", { offer, callerId: socket.id });
      });

      socket.on("answer", ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", { answer, calleeId: socket.id });
      });

      socket.on("ice-candidate", ({ roomId, candidate }) => {
        socket.to(roomId).emit("ice-candidate", { candidate, senderId: socket.id });
      });

      socket.on("chat-message", (message) => {
        if (!message?.roomId) return;
        socket.to(message.roomId).emit("chat-message", message);
      });

      socket.on("media-state", (state) => {
        if (!state?.roomId) return;
        socket.to(state.roomId).emit("media-state", { ...state, senderId: socket.id });
      });

      socket.on("leave-room", (roomId: string) => {
        socket.leave(roomId);
        socket.to(roomId).emit("user-disconnected", socket.id);
        socket.data.roomId = null;
      });

      socket.on("disconnect", () => {
        const roomId = socket.data?.roomId;
        if (roomId) {
          socket.to(roomId).emit("user-disconnected", socket.id);
        }
      });
    });
  }
  return io;
};

export const getIO = () => io;

export default initializeSocket;
