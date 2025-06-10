const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html')
})

io.on('connection',(socket)=>{
    console.log("A user connected");
    socket.on('message',(message)=>{
        io.emit('message',message);
        console.log(message);
    })
    socket.on('disconnect',()=>{
        console.log("A user disconnected");
    })
})

server.listen(3000, '0.0.0.0', () => {
    console.log("Listening on 3000...");
})