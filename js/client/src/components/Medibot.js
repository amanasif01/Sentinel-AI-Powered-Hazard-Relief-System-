import React, { useState, useEffect, useRef } from 'react';
import './Medibot.css';

const Medibot = ({ onClose, location, onOpenHospitals }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm Medibot. I can provide first-aid advice and help you find medical facilities. How can I help you today?",
            sender: 'bot',
            suggestions: ['Find nearby hospitals', 'CPR instructions', 'Treating a burn']
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!location) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                    }
                );
            }
        }
    }, [location]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (eOrText) => {
        let userText;
        if (typeof eOrText === 'string') {
            userText = eOrText; // Called from suggestion chip
        } else {
            eOrText.preventDefault(); // Called from form submit
            userText = input;
        }

        if (!userText.trim()) return;
        const userMessage = { id: Date.now(), text: userText, sender: 'user' };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/medibot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userText,
                    context: { location: location || userLocation || { lat: 0, lon: 0 } }
                })
            });

            const data = await response.json();

            const botMessage = {
                id: Date.now() + 1,
                text: data.text || "Sorry, I didn't get that.",
                sender: 'bot',
                isError: !data.success,
                action: data.relatedAction
            };

            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Medibot error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I'm having trouble connecting to the server. Please try again.",
                sender: 'bot',
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="medibot-overlay" onClick={onClose}>
            <div className="medibot-modal" onClick={e => e.stopPropagation()}>
                <div className="medibot-header">
                    <div className="medibot-title">
                        <i className="fas fa-robot"></i> MEDIBOT
                    </div>
                    <button className="medibot-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="medibot-messages">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                            <div dangerouslySetInnerHTML={{
                                __html: msg.text
                                    .replace(/\n/g, '<br/>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="medibot-direction-btn"><i class="fas fa-map-marker-alt"></i> $1</a>')
                            }} />

                            {msg.suggestions && (
                                <div className="medibot-suggestions">
                                    {msg.suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            className="suggestion-chip"
                                            onClick={() => handleSend(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {msg.action === 'OPEN_HOSPITALS' && (
                                <div
                                    className="suggested-action"
                                    onClick={() => {
                                        if (onOpenHospitals) {
                                            onOpenHospitals();
                                            onClose();
                                        }
                                    }}
                                >
                                    <i className="fas fa-hospital"></i> View Nearby Hospitals
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="message bot">
                            <div className="typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="medibot-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="medibot-input"
                        placeholder="Ask Medibot..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={isTyping}
                    />
                    <button type="submit" className="medibot-send-btn" disabled={!input.trim() || isTyping}>
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Medibot;
