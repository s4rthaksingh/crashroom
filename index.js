const { generate, count } = require("random-words");

const shuffle = str => [...str].sort(()=>Math.random()-.5).join('');
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


let usercount = 0;
let chosenword = null;


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
    usercount+=1;
    io.emit("updateCount",usercount);
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
        if (!message.username || message.username.toLowerCase() == "system") message.username = socket.username;
        if (chosenword) {
            if(message.message == chosenword){
                io.emit('message', {'message':`has guessed the right word : ${chosenword}`,username:socket.username});
                chosenword = null;
                return;
            }
        }
        if (message.message.startsWith("/scramble")){
            chosenword = generate({minLength:parseInt(message.message.split(" ")[1]) || 6,
                maxLength : parseInt(message.message.split(" ")[1]) || null
            });
            io.emit('message',{'message':`${message.username} has started a game of scramble. The scrambled word is : ${shuffle(chosenword)}`,'username':'System'});
            console.log(chosenword);
            return;
        }
        io.emit('message', message);
    })
    socket.on('disconnect',()=>{
        usercount-=1;
        io.emit("updateCount",usercount);
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

