import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './FloatingSOS.css';

const FloatingSOS = () => {
    const { user } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState(null); // 'success' or 'error'
    const [statusMessage, setStatusMessage] = useState('');

    // Handle countdown logic
    useEffect(() => {
        let timer;
        if (showModal && countdown > 0 && !isSending && !status) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && !isSending && !status) {
            // Auto-send when countdown reaches 0
            sendSOS();
        }
        return () => clearInterval(timer);
    }, [showModal, countdown, isSending, status]);

    const requestLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy: position.coords.accuracy
            }),
            (error) => {
                let errorMessage = 'Failed to get location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please allow location access to use SOS.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        break;
                }
                reject(new Error(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
        );
    });

    const sendSOS = async () => {
        if (!user || !user.email) {
            setStatus('error');
            setStatusMessage('You must be logged in to send an SOS alert.');
            return;
        }

        setIsSending(true);
        setStatus(null);
        setStatusMessage('');

        try {
            const { lat, lon, accuracy } = await requestLocation();
            const resp = await fetch('/api/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, latitude: lat, longitude: lon, accuracy })
            });
            const data = await resp.json();

            if (data.success) {
                setStatus('success');
                setStatusMessage(data.message || 'SOS sent successfully');
            } else {
                setStatus('error');
                setStatusMessage(data.error || 'Failed to send SOS');
            }
        } catch (e) {
            console.error('SOS error:', e);
            setStatus('error');
            setStatusMessage(e.message || 'Failed to get location / send SOS');
        } finally {
            setIsSending(false);
            // Automatically close modal after a few seconds if successful
            if (status !== 'error') {
                setTimeout(() => {
                    handleClose();
                }, 3000);
            }
        }
    };

    const handleSOSClick = () => {
        if (!user || !user.email) {
            // Optional: Redirect to login or just show an alert
            alert('You must be logged in to use the SOS feature.');
            return;
        }
        setShowModal(true);
        setCountdown(5);
        setStatus(null);
        setStatusMessage('');
    };

    const handleCancel = () => {
        setShowModal(false);
        setCountdown(5);
        setStatus(null);
    };

    const handleClose = () => {
        setShowModal(false);
        setCountdown(5);
        setStatus(null);
    };

    return (
        <>
            {/* Floating Button */}
            <div className="floating-sos-btn" onClick={handleSOSClick}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>SOS</span>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="floating-sos-modal-overlay">
                    <div className="floating-sos-modal">
                        {!status && !isSending && (
                            <>
                                <div className="sos-modal-header pulse-red">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <h2>Emergency SOS</h2>
                                </div>
                                <p>Sending distress signal and location to your emergency contacts in:</p>
                                <div className="countdown-timer">{countdown}</div>
                                <div className="sos-modal-actions">
                                    <button className="sos-cancel-btn" onClick={handleCancel}>
                                        Cancel
                                    </button>
                                    <button className="sos-send-now-btn" onClick={sendSOS}>
                                        Send Now
                                    </button>
                                </div>
                            </>
                        )}

                        {isSending && (
                            <div className="sos-loading">
                                <div className="spinner pulse-red"></div>
                                <p>Acquiring location and sending SOS...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="sos-success">
                                <i className="fas fa-check-circle"></i>
                                <h3>SOS Sent</h3>
                                <p>{statusMessage}</p>
                                <button className="sos-close-btn" onClick={handleClose}>Close</button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="sos-error">
                                <i className="fas fa-times-circle"></i>
                                <h3>SOS Failed</h3>
                                <p>{statusMessage}</p>
                                <button className="sos-retry-btn" onClick={sendSOS}>Retry</button>
                                <button className="sos-cancel-btn" onClick={handleClose}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingSOS;
