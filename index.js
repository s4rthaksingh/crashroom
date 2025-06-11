const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket'],
    path: '/socket.io/',
    pingTimeout: 60000,
    pingInterval: 25000
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html')
})

io.on('connection',(socket)=>{
    socket.on('message',(message)=>{
        io.emit('message', message);
    })
})

if(process.env.NODE_ENV !== 'production'){
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Listening on ${port}...`);
    })
}

module.exports = server;