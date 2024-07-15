import React, { useEffect, useState, useRef } from 'react';
import { FormControl, IconButton, Input, InputLabel, Button } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import axios from 'axios';
import FlipMove from 'react-flip-move';
import Message from './Message/Message';
import Logo from '../assets/images/logo.png';
import './App.css';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState('');
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
       
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
       
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get('http://localhost:5000/messages');
                setMessages(response.data);
                scrollToBottom(); // Scroll to bottom after fetching messages
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
    }, []);

    const signIn = () => {
        const usernamePrompt = prompt('Please enter your username:');
        if (usernamePrompt) {
            setUser({ displayName: usernamePrompt });
            setUsername(usernamePrompt);
        }
    };

    const signOut = () => {
        setUser(null);
        setUsername('');
    };

    const updateInput = (e) => {
        setInput(e.target.value);
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (user) {
            try {
                const response = await axios.post('http://localhost:5000/messages', {
                    username: username,
                    message: input
                });
                setMessages((prevMessages) => [...prevMessages, response.data]);  
                setInput('');
                scrollToBottom();  
            } catch (error) {
                console.error('Error sending message:', error);
            }
        } else {
            alert('Please sign in to send messages.');
        }
    };

  

    const theme = createMuiTheme({
        palette: {
            primary: { main: '#0b81ff' },
            secondary: { main: '#0b81ff' },
        },
    });

    return (
        <div className="app">
            <header className="app__header">
                <h1><img src={Logo} className="logo" alt="React Messenger" /> React Messenger</h1>
                {user ? (
                    <>
                        <Button onClick={signOut} style={{ color: 'white', backgroundColor: 'black' }}>Sign Out</Button>
                        <h3>Welcome <span className="bold">{username}</span>!</h3>
                    </>
                ) : (
                    <Button onClick={signIn} style={{ color: 'white', backgroundColor: 'black' }}>Sign In</Button>
                )}
            </header>

            <div className="app__messageContainer">
                <FlipMove>
                    {messages.map(({ id, username, message }) => (
                        <Message key={id} username={username} message={message} />
                    ))}
                </FlipMove>
                <div ref={messagesEndRef} />
            </div>

            <form className="app__form" onSubmit={sendMessage}>
                <ThemeProvider theme={theme}>
                    <FormControl className="app__formControl">
                        <InputLabel>Type a message...</InputLabel>
                        <Input className="app__input" value={input} onChange={updateInput} />
                        <IconButton className="app__button" disabled={!input} color="primary" variant="contained" type="submit">
                            <SendIcon />
                        </IconButton>
                    </FormControl>
                </ThemeProvider>
            </form>
        </div>
    );
}

export default App;
