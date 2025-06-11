const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
});

function generateUsername() {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Swift', 'Bright', 'Calm', 'Eager', 'Fierce', 'Gentle', 'Jolly', 
                      'Lively', 'Mighty', 'Nimble', 'Proud', 'Quick', 'Royal', 'Smart', 'Tender', 'Vivid', 'Wise'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Lion', 'Fox', 'Bear', 'Hawk', 'Shark',
                  'Dragon', 'Phoenix', 'Falcon', 'Lynx', 'Puma', 'Jaguar', 'Leopard', 'Panther', 'Cobra', 'Python'];
    const number = Math.floor(Math.random() * 10000);
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${randomAdj}${randomNoun}${number}`;
}

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html')
})

io.on('connection',(socket)=>{
    console.log("A user connected");
    io.emit('newuser',io.engine.clientsCount)
    io.emit('send',{'message':"has joined the chat",'username':'A new user'})
    socket.on('send',(send)=>{
        io.emit('send',send);
    })
    socket.on('disconnect',()=>{
        io.emit('send',{'message':"has left the chat",'username':'A user'})
        io.emit('newuser',io.engine.clientsCount)
    })
})

const port = process.env.port || 3000;
server.listen(port, '0.0.0.0', () => {
    console.log(`Listening on ${port}...`);
})