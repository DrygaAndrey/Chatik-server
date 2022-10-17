const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const PORT = process.env.PORT || 80;
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let rooms = [
  {
    roomId: 0,
    users: [
      { name: "John", id: 0, socketId: "woqep[1" },
      { name: "Ivan", id: 1, socketId: "woqep[1" },
    ],
    messages: [
      {
        text: "kek",
        ownerId: 0,
        ownerNickName: "John",
      },
      {
        text: "figek",
        ownerId: 1,
        ownerNickName: "Ivan",
      },
    ],
  },
];
let currentId = 10;

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("enterToRoom", ({ userName, roomId }) => {
    console.log("entered ", userName, roomId);
    const room = rooms.find((room) => room.roomId == roomId);
    if (room) {
      room.users.push({ name: userName, id: currentId++, socketId: socket.id });
      room.users.forEach((user) => {
        io.to(user.socketId).emit("updateInfo", room);
      });
    } else {
      rooms.push({
        roomId: roomId,
        users: [{ name: userName, id: currentId++, socketId: socket.id }],
        messages: [],
      });
      const room = rooms.find((room) => room.roomId == roomId);
      room.users.forEach((user) => {
        io.to(user.socketId).emit("updateInfo", room);
      });
    }
  });

  socket.on("sendMessage", (message) => {
    console.log("user", socket.id, "send message:", message);
    const room = rooms.find((room) =>
      room.users.find((user) => user.socketId === socket.id)
    );
    room.messages.push({
      text: message,
      ownerNickName: room.users.find((user) => user.socketId === socket.id)
        .name,
      ownerId: room.users.find((user) => user.socketId === socket.id).id,
    });
    room.users.forEach((user) => {
      io.to(user.socketId).emit("updateInfo", room);
    });
    console.log("room saved", room);
  });

  socket.on("getInfo", () => {
    console.log('send unfo')
    io.to(socket.id).emit("sendInfo", rooms);
  });

  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      room.users.forEach((user) => {
        if (user.socketId === socket.id) {
          newUsers = room.users.filter((user) => user.socketId !== socket.id);
          room.users = newUsers;
          room.messages.push({
            text: `${user.name} left the chat`,
            ownerNickName: "Server info",
          });
        }
      });
      if (room.users.length === 0) {
        rooms = rooms.filter((room) => room.users.length > 0);
      } else {
        room.users.forEach((user) => {
          io.to(user.socketId).emit("updateInfo", room);
        });
      }
    });
    console.log("user disconnected:", socket.id);
  });
});

server.listen(PORT, (err) => {
  if (err) {
    throw Error(err);
  }
  console.log("Server launched at", PORT, "port");
});
