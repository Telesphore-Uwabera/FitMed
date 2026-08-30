const { Server } = require("socket.io");

let io = null;

// roomId → Map<role, socketId>  (tracks who owns each role slot)
const roomRoles = new Map(); // roomId → { doctor: socketId|null, applicant: socketId|null }

function getRoomRoles(roomId) {
  if (!roomRoles.has(roomId)) roomRoles.set(roomId, { doctor: null, applicant: null });
  return roomRoles.get(roomId);
}

const initializeSocket = (server) => {
  if (!io) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const extraOrigins = (
      process.env.SOCKET_CORS_ORIGINS ||
      "https://fitnessmed.netlify.app,https://fitnessmed.rw"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    io = new Server(server, {
      cors: {
        origin: appUrl
          ? [appUrl, ...extraOrigins, "http://localhost:3000", "http://localhost:3001"]
          : true,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {

      // ────────────────────────────────────────────────────────────────────────
      // JOIN ROOM  — max 2 peers (doctor + applicant), one socket per role
      // ────────────────────────────────────────────────────────────────────────
      socket.on("join-room", (payload) => {
        const roomId = typeof payload === "string" ? payload : payload?.roomId;
        const name   = typeof payload === "object" ? payload?.name  : "";
        const role   = typeof payload === "object" ? payload?.role  : ""; // "doctor" | "applicant"
        if (!roomId) return;

        const roles = getRoomRoles(roomId);
        const validRole = role === "doctor" || role === "applicant";

        if (validRole) {
          const existingSocketId = roles[role];

          if (existingSocketId && existingSocketId !== socket.id) {
            // Same role already in room from a DIFFERENT socket (tab/device switch)
            // Ask the new socket to wait; tell the OLD socket someone wants to take over
            const oldSocket = io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
              // Old socket still alive — ask it to hand over
              oldSocket.emit("device-takeover-request", { newSocketId: socket.id, name, role });
              // Park the new socket in a pending state — reply comes via "device-takeover-accept/reject"
              socket.data.pendingRoom = roomId;
              socket.data.name = name;
              socket.data.role = role;
              socket.emit("device-switch-pending", {
                message: "Your previous session is still active. Waiting for confirmation…",
              });
              return; // Don't join room yet
            } else {
              // Old socket is gone (stale entry) — clean up and let new socket in
              roles[role] = null;
            }
          }
        }

        // Enforce max 2 total occupants for different roles
        const room = io.sockets.adapter.rooms.get(roomId);
        const occupants = room ? room.size : 0;
        const otherRole = role === "doctor" ? "applicant" : "doctor";
        const otherTaken = roles[otherRole] != null;
        if (!validRole && occupants >= 2) {
          socket.emit("room-full");
          return;
        }
        if (validRole && otherTaken && occupants >= 2 && roles[role] !== socket.id) {
          // Room has both doctor & applicant already
          socket.emit("room-full");
          return;
        }

        // ── Actually join ──────────────────────────────────────────────────
        socket.data.roomId = roomId;
        socket.data.name   = name;
        socket.data.role   = role;
        if (validRole) roles[role] = socket.id;

        socket.join(roomId);
        socket.to(roomId).emit("user-connected", { socketId: socket.id, name, role });

        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (roomSize >= 2) {
          io.to(roomId).emit("call-ready");
        }
      });

      // ── Old tab ACCEPTS the device switch ─────────────────────────────────
      socket.on("device-takeover-accept", ({ newSocketId }) => {
        const newSocket = io.sockets.sockets.get(newSocketId);
        if (!newSocket) return;

        const roomId = newSocket.data.pendingRoom;
        const name   = newSocket.data.name;
        const role   = newSocket.data.role;
        if (!roomId) return;

        // Evict old socket
        const roles = getRoomRoles(roomId);
        roles[role] = null;
        socket.leave(roomId);
        socket.to(roomId).emit("user-disconnected", socket.id);
        socket.data.roomId = null;
        socket.emit("evicted", { reason: "You joined from a new device." });

        // Now let new socket join
        newSocket.data.pendingRoom = null;
        newSocket.data.roomId = roomId;
        roles[role] = newSocket.id;
        newSocket.join(roomId);
        newSocket.to(roomId).emit("user-connected", { socketId: newSocket.id, name, role });
        newSocket.emit("device-switch-accepted");
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (roomSize >= 2) io.to(roomId).emit("call-ready");
      });

      // ── Old tab REJECTS the device switch ─────────────────────────────────
      socket.on("device-takeover-reject", ({ newSocketId }) => {
        const newSocket = io.sockets.sockets.get(newSocketId);
        if (newSocket) {
          newSocket.emit("device-switch-rejected", {
            message: "Your previous session rejected the switch. Close the other tab first.",
          });
          newSocket.data.pendingRoom = null;
        }
      });

      // ── Signaling ─────────────────────────────────────────────────────────
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

      // ── Leave / Disconnect ─────────────────────────────────────────────────
      socket.on("leave-room", (roomId) => {
        _cleanupSocket(socket, roomId);
      });

      socket.on("disconnect", () => {
        _cleanupSocket(socket, socket.data?.roomId);
      });
    });
  }
  return io;
};

function _cleanupSocket(socket, roomId) {
  if (!roomId) return;
  const roles = getRoomRoles(roomId);
  if (roles.doctor === socket.id)    roles.doctor = null;
  if (roles.applicant === socket.id) roles.applicant = null;
  // Clean up empty room entry
  if (!roles.doctor && !roles.applicant) roomRoles.delete(roomId);
  socket.leave(roomId);
  socket.to(roomId).emit("user-disconnected", socket.id);
  socket.data.roomId = null;
}

const getIO = () => io;

module.exports = { initializeSocket, getIO };
