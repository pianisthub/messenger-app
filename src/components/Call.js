import React, { useEffect, useRef, useState } from 'react'; //dec21
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import './Call.css';

const Call = ({ username }) => {
    const [stream, setStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState('');
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [userToCall, setUserToCall] = useState('');
    const [error, setError] = useState('');
    const socketRef = useRef();
    const userAudio = useRef();
    const partnerAudio = useRef();
    const peerRef = useRef();
    const peersRef = useRef([]);
    const callTimeoutRef = useRef(null);

    useEffect(() => {
        socketRef.current = io.connect('https://messenger-app-rvsu.onrender.com'); // Change to  backend URL
        console.log('Connecting to signaling server...');

        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then(stream => {
                setStream(stream);
                socketRef.current.emit('join-room', username);
                console.log(`Joined room as ${username}`);
            })
            .catch(error => {
                console.warn('Error accessing media devices, proceeding without media devices:', error);
                socketRef.current.emit('join-room', username);
                console.log(`Joined room as ${username}`);
            });

        socketRef.current.on('incoming-call', (data) => {
            console.log('Incoming call from:', data.from);
            setReceivingCall(true);
            setCaller(data.from);
            setCallerSignal(data.signal);
        });

        socketRef.current.on('call-accepted', (signal) => {
            console.log('Call accepted');
            setCallAccepted(true);
            clearTimeout(callTimeoutRef.current);  
            peerRef.current.signal(signal);
        });

        socketRef.current.on('call-error', (message) => {
            setError(message);
            console.error('Call error:', message);
        });

    }, [username]);

    const callUser = () => {
        console.log(`Calling ${userToCall}`);
        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream || undefined  
        });

        peer.on('signal', (signal) => {
            console.log('Emitting call-user event');
            socketRef.current.emit('call-user', { userToCall, from: username, signal });
            console.log('Signal sent to', userToCall);

             
            callTimeoutRef.current = setTimeout(() => {
                if (!callAccepted) {
                    setError('Call not answered.');
                    console.log('Call not answered.');
                    socketRef.current.emit('call-error', { to: username, message: 'Call not answered.' });
                }
            }, 10000);  
        });

        peer.on('stream', (stream) => {
            if (partnerAudio.current) {
                partnerAudio.current.srcObject = stream;
            }
        });

        peer.on('error', err => {
            console.error('Peer error:', err);
            setError('Call error: ' + err.message);
        });

        peersRef.current.push(peer);
        peerRef.current = peer;
    };

    const acceptCall = () => {
        console.log('Call accepted');
        setCallAccepted(true);
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: stream || undefined  
        });
        peer.on('signal', (signal) => {
            console.log('Emitting accept-call event');
            socketRef.current.emit('accept-call', { signal, to: caller });
            console.log('Signal sent to', caller);
        });
        peer.signal(callerSignal);
        peer.on('stream', (stream) => {
            if (partnerAudio.current) {
                partnerAudio.current.srcObject = stream;
            }
        });

        peer.on('error', err => {
            console.error('Peer error:', err);
            setError('Call error: ' + err.message);
        });

        peersRef.current.push(peer);
        peerRef.current = peer;
    };

    const declineCall = () => {
        console.log('Call declined');
        socketRef.current.emit('decline-call', { to: caller });
    
         
        if (peerRef.current) {
            peerRef.current.destroy();
        }
    
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    
        setReceivingCall(false);
        setCaller('');
        setCallerSignal(null);
        setCallAccepted(false);
    };

    return (
        <div className="call-container">
            {callAccepted && <audio ref={userAudio} autoPlay />}
            {callAccepted && <audio ref={partnerAudio} autoPlay />}
            {callAccepted && <video ref={userVideo} autoPlay />}
{callAccepted && <video ref={partnerVideo} autoPlay />}
            <div>
                <input
                    type="text"
                    placeholder="Enter username to call"
                    value={userToCall}
                    onChange={(e) => setUserToCall(e.target.value)}
                />
                <button onClick={callUser}>Call</button>
                <button onClick={declineCall}>Decline</button>
            </div>
            <div>
                {receivingCall && !callAccepted ? (
                    <div>
                        <h1>{caller} is calling you</h1>
                        <button onClick={acceptCall}>Accept</button>
                        <button onClick={declineCall}>Decline</button>
                    </div>
                ) : null}
            </div>
            <div>
                {callAccepted ? (
                    <div>
                        <h1>In call with {caller ? caller : userToCall}</h1>
                        
                    </div>
                ) : null}
            </div>
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Call;
