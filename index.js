function generateUsername(){
    const adjectives = ['Happy', 'Clever', 'Brave', 'Swift', 'Bright', 'Calm', 'Eager', 'Fierce', 'Gentle', 'Jolly', 
        'Lively', 'Mighty', 'Nimble', 'Proud', 'Quick', 'Royal', 'Smart', 'Tender', 'Vivid', 'Wise'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Lion', 'Fox', 'Bear', 'Hawk', 'Shark',
    'Dragon', 'Phoenix', 'Falcon', 'Lynx', 'Puma', 'Jaguar', 'Leopard', 'Panther', 'Cobra', 'Python'];

    const number = Math.floor(Math.random() * 10000);
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const generatedUsername = `${randomAdj}${randomNoun}${number}`;
    return(generatedUsername);
}



const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html')
})

io.on('connection',(socket)=>{
    const username = generateUsername();
    socket.username = username;
    io.emit('setUsername',username);
    io.emit('message',{
        'message':'has joined the chat',
        'username':socket.username
    })
    socket.on('changeUsername',(newusername)=>{
        io.emit('message',{
            'message':`has changed their username to ${newusername}`,
            'username':socket.username
        })
        socket.username = newusername;
    })
    socket.on('message',(message)=>{
        if (!message.username) message.username = socket.username;
        io.emit('message', message);
    })
    socket.on('disconnect',()=>{
        io.emit('message',{
            'message':'left the chat',
            'username': socket.username
        })
    })
})

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

