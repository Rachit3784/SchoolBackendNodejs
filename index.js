import http from "http"
import { app } from "./app.js"
import { Server } from "socket.io";
import {SaveMessage} from "./controller/SaveMessage.js"
import { MakeFriendRequest } from "./controller/ChatsAndFriendsController.js";
const server = http.createServer(app);

const PORT = process.env.PORT || 4590;


const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});




const users = {}; 


io.on("connection", async (socket) => {
  console.log("New user connected:", socket.id);


 socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log("User registered:", userId, socket.id);
  });


  socket.on('send-friend-request' , async ({from, SenderType , RecieverType, to})=>{
      const Response =  await MakeFriendRequest(from, SenderType , RecieverType, to);

      if(Response.success){
        
        io.to(users[to]).emit('recieve-friend-request',{
          Sender : from, SenderType , RecieverType, You : to , message : `${Response.SenderName} sent you a connection request `
        })
      }
  })



  socket.on("send-message", async ({ from, to, message }) => {


    const receiverSocket = users[to];


   console.log(message ," == " , users[to] , " == " , from ,  "  == ", to )


    if (receiverSocket) {

      io.to(receiverSocket).emit("receive-message", {
        from,
        message,
      });
    }

    const data = { from, to, message};

   const response = await SaveMessage(data);

   if(response.success){
    //push notification
   }


  });


  socket.on("disconnect", () => {
    // Remove user entry
    for (const key in users) {
      if (users[key] === socket.id) {
        delete users[key];
        break;
      }
    }
    console.log("Disconnected:", socket.id);
  });


});





server.listen(PORT , ()=>{
console.log(`server started at http://localhost:${PORT}`);
})