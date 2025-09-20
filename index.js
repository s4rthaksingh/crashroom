const { generate, count } = require("random-words");
const fs = require('fs');

const shuffle = str => [...str].sort(()=>Math.random()-.5).join('');

function getHangmanDrawing(wrongCount) {
    const drawings = [
        "", // 0 wrong
        "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========", // 1 wrong
        "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========", // 2 wrong
        "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========", // 3 wrong
        "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========", // 4 wrong
        "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========", // 5 wrong
        "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========", // 6 wrong
        "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="  // 7 wrong (game over)
    ];
    return drawings[Math.min(wrongCount, 7)];
}

function getRandomMovie() {
    try {
        const moviesData = fs.readFileSync('movies.json', 'utf8');
        const movies = JSON.parse(moviesData);
        return movies[Math.floor(Math.random() * movies.length)];
    } catch (error) {
        console.error('Error loading movies:', error);
        // Fallback to random word if movies.json fails
        return generate({minLength: 5, maxLength: 8});
    }
}

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
let connectedUsers = new Map(); // Track connected users by socket ID
let chosenword = null;
let typeracesentence = null;
let usernamelist = [];
let collectedusercount = 0;
let scrambleTimeout = null;
let typeraceTimeout = null;

// Hangman game variables
let hangmanWord = null;
let hangmanGuessed = [];
let hangmanWrong = 0;
let hangmanTimeout = null;

// Trivia game variables
let triviaQuestion = null;
let triviaAnswer = null;
let triviaTimeout = null;

// Emoji game variables
let emojiGame = null;
let emojiAnswer = null;
let emojiTimeout = null;

// Number guessing game variables
let numberGame = null;
let numberToGuess = null;
let numberTimeout = null;

// Word chain game variables
let wordChain = null;
let lastWord = null;
let wordChainTimeout = null;

// Riddle game variables
let riddleGame = null;
let riddleAnswer = null;
let riddleTimeout = null;

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
    console.log(`New connection: ${socket.id}`);
    usercount+=1;
    const username = generateUsername();
    socket.username = username;
    connectedUsers.set(socket.id, username);
    console.log(`Total users: ${usercount}, Connected users: ${connectedUsers.size}`);
    io.emit("updateCount",usercount);
    socket.emit('setUsername',username);
    io.emit('message',{
        'message':`${socket.username} has joined the chat`,
        'username':'System'
    })
    socket.on('changeUsername',(newusername)=>{
        io.emit('message',{
            'message':`${socket.username} has changed their username to ${newusername}`,
            'username':'System'
        })
        socket.username = newusername;
        connectedUsers.set(socket.id, newusername);
    })
    socket.on('message',(message)=>{
        if (!message.username || message.username.toLowerCase() == "system") message.username = socket.username;
        if (chosenword) {
            if(message.message == chosenword){
                io.emit('message', message);
                io.emit('message', {'message':`${socket.username} has guessed the right word: ${chosenword}`,username:'System'});
                chosenword = null;
                if (scrambleTimeout) clearTimeout(scrambleTimeout);
                return;
            }
        }
        if (message.message.startsWith("/scramble")){
            io.emit('message', message);
            const wordLength = parseInt(message.message.split(" ")[1]) || 6;
            chosenword = generate({minLength: wordLength, maxLength: wordLength});
            io.emit('message',{'message':`${message.username} has started a game of scramble. The scrambled word is : ${shuffle(chosenword)}`,'username':'System'});
            console.log('Scramble word:', chosenword);
            if (scrambleTimeout) clearTimeout(scrambleTimeout);
            scrambleTimeout = setTimeout(() => {
                if (chosenword) {
                    io.emit('message', {message: `Time's up! The word was: ${chosenword}`, username: 'System'});
                    chosenword = null;
                }
            }, 60000);
            return;
        }

        if (typeracesentence){
            io.emit('message', message);
            if (message.message.toLowerCase() == typeracesentence.toLowerCase()){
                io.emit('message', {'message':`${socket.username} has typed it first!`,username:'System'});
                io.emit('enablecopycutpaste');
                typeracesentence = null;
                if (typeraceTimeout) clearTimeout(typeraceTimeout);
                return;
            }
            return;
        }

        if (message.message === "/typerace"){
            io.emit('message', message);
            const sentencelength = Math.floor(Math.random() * 6) + 10; // 10-15 words
            typeracesentence = generate(sentencelength).join(" ");
            io.emit('message',{'message':`${message.username} has started a type race. The sentence is : ${typeracesentence}`,'username':'System'});
            io.emit('disablecopycutpaste');
            console.log('Type race sentence:', typeracesentence);
            if (typeraceTimeout) clearTimeout(typeraceTimeout);
            typeraceTimeout = setTimeout(() => {
                if (typeracesentence) {
                    io.emit('message', {message: `Time's up! The sentence was: ${typeracesentence}`, username: 'System'});
                    typeracesentence = null;
                    io.emit('enablecopycutpaste');
                }
            }, 60000);
            return;
        }

        // Hangman game logic
        if (message.message === "/hangman"){
            io.emit('message', message);
            hangmanWord = getRandomMovie().toLowerCase();
            hangmanGuessed = [];
            hangmanWrong = 0;
            
            // Auto-reveal vowels and spaces
            const vowels = ['a', 'e', 'i', 'o', 'u'];
            hangmanGuessed = [...vowels, ' '];
            
            const displayWord = hangmanWord.split('').map(letter => {
                if (letter === ' ') return ' ';
                return hangmanGuessed.includes(letter) ? letter : '_';
            }).join(' ');
            
            io.emit('message',{'message':`${message.username} has started a game of Hangman!\n🎬 Movie: ${displayWord}\nGuess a letter or the whole movie title!`,'username':'System'});
            console.log('Hangman movie:', hangmanWord);
            if (hangmanTimeout) clearTimeout(hangmanTimeout);
            hangmanTimeout = setTimeout(() => {
                if (hangmanWord) {
                    io.emit('message', {message: `Time's up! The movie was: ${hangmanWord}`, username: 'System'});
                    hangmanWord = null;
                }
            }, 120000); // 2 minutes for hangman
            return;
        }

        // Handle hangman guesses
        if (hangmanWord) {
            const guess = message.message.toLowerCase().trim();
            
            // Check if it's a single letter guess
            if (guess.length === 1 && /[a-z]/.test(guess)) {
                if (hangmanGuessed.includes(guess)) {
                    io.emit('message', {'message': `${message.username} already guessed '${guess}'!`, 'username': 'System'});
                    return;
                }
                
                hangmanGuessed.push(guess);
                
                if (hangmanWord.includes(guess)) {
                    // Correct letter
                    const displayWord = hangmanWord.split('').map(letter => {
                        if (letter === ' ') return ' ';
                        return hangmanGuessed.includes(letter) ? letter : '_';
                    }).join(' ');
                    io.emit('message', {'message': `Good guess! ${displayWord}`, 'username': 'System'});
                    
                    // Check if word is complete
                    if (!displayWord.includes('_')) {
                        io.emit('message', {'message': `🎉 ${message.username} solved it! The movie was: ${hangmanWord}`, 'username': 'System'});
                        hangmanWord = null;
                        if (hangmanTimeout) clearTimeout(hangmanTimeout);
                        return;
                    }
                } else {
                    // Wrong letter
                    hangmanWrong++;
                    const hangmanDrawing = getHangmanDrawing(hangmanWrong);
                    io.emit('message', {'message': `Wrong! ${hangmanDrawing}\nGuessed letters: ${hangmanGuessed.filter(l => l !== ' ').join(', ')}`, 'username': 'System'});
                    
                    if (hangmanWrong >= 6) {
                        io.emit('message', {'message': `💀 Game Over! The movie was: ${hangmanWord}`, 'username': 'System'});
                        hangmanWord = null;
                        if (hangmanTimeout) clearTimeout(hangmanTimeout);
                        return;
                    }
                }
                return;
            }
            
            // Check if it's a word guess (case insensitive)
            if (guess === hangmanWord) {
                io.emit('message', {'message': `🎉 ${message.username} solved it! The movie was: ${hangmanWord}`, 'username': 'System'});
                hangmanWord = null;
                if (hangmanTimeout) clearTimeout(hangmanTimeout);
                return;
            } else if (guess.length > 1) {
                hangmanWrong++;
                const hangmanDrawing = getHangmanDrawing(hangmanWrong);
                io.emit('message', {'message': `Wrong movie! ${hangmanDrawing}`, 'username': 'System'});
                
                if (hangmanWrong >= 6) {
                    io.emit('message', {'message': `💀 Game Over! The movie was: ${hangmanWord}`, 'username': 'System'});
                    hangmanWord = null;
                    if (hangmanTimeout) clearTimeout(hangmanTimeout);
                    return;
                }
                return;
            }
        }

        if (message.message === "/users"){
            io.emit('message', message);
            // Get all connected usernames from the Map
            const userList = Array.from(connectedUsers.values());
            console.log(`/users command - Connected users: ${userList.length}`);
            if (userList.length > 0) {
                io.emit('message', {'message': userList.join('\n'), 'username': 'System'});
            } else {
                io.emit('message', {'message': 'No users currently online', 'username': 'System'});
            }
            return;
        }

        if(message.message === "/help"){
            io.emit('message', message);
            io.emit('message',{'message':"/scramble [word_length] - Start a word scramble game\n/typerace - Start a typing race\n/hangman - Start a hangman game\n/users - Show all online users\n/help - Show this help message",'username':'System'})
            return;
        }

        io.emit('message', message);


    })




    socket.on('requestNewUsername', () => {
        const newUsername = generateUsername();
        socket.username = newUsername;
        connectedUsers.set(socket.id, newUsername);
        socket.emit('setUsername', newUsername);
    });

    socket.on('disconnect',()=>{
        console.log(`User disconnected: ${socket.id} (${socket.username})`);
        usercount-=1;
        connectedUsers.delete(socket.id);
        console.log(`After disconnect - Total users: ${usercount}, Connected users: ${connectedUsers.size}`);
        io.emit("updateCount",usercount);
        io.emit('message',{
            'message':`${socket.username} left the chat`,
            'username':'System'
        })
    })
})

// Periodic cleanup to ensure accurate user count
setInterval(() => {
    const actualConnections = io.engine.clientsCount;
    if (actualConnections !== usercount) {
        console.log(`Mismatch detected! Engine count: ${actualConnections}, Our count: ${usercount}`);
        usercount = actualConnections;
        io.emit("updateCount", usercount);
    }
}, 5000); // Check every 5 seconds

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

