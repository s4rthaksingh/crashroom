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
    socket.on('message',(message)=>{
        io.emit('message',message);
    })
})

if(process.env.NODE_ENV !== 'production'){
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on ${port}...`);
})}

module.exports = server;