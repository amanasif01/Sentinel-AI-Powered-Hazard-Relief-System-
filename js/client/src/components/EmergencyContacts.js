import React, { useState, useEffect } from 'react';
import './EmergencyContacts.css';

const EmergencyContacts = ({ userEmail, username, onClose, isPage = false }) => {
  const [contacts, setContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [newContact, setNewContact] = useState({ email: '', name: '' });
  const [isLoading, setIsLoading] = useState(false); // generic fallback
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isSOSLoading, setIsSOSLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'requests'

  // useEffect placed after helper function definitions for clarity

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/auth/profile/${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (data.success) {
        // server returns profile under profile key
        const list = (data.profile?.emergencyContacts) || (data.user?.emergencyContacts) || [];
        setContacts(list);
      } else {
        setError('Failed to load emergency contacts');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Network error. Please try again.');
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const response = await fetch(`/api/auth/emergency-requests/incoming/${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) {
        setIncomingRequests(data.requests || []);
      }
    } catch (e) {
      // ignore silently for now
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchUserProfile();
      fetchIncomingRequests();
    }
  }, [userEmail]);

  const handleAddContact = async (e) => {
    e.preventDefault();

    if (!newContact.email.trim()) {
      setError('Emergency contact email is required');
      return;
    }

    setIsContactLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/emergency-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          contactEmail: newContact.email,
          contactName: newContact.name
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(data.user.emergencyContacts);
        setNewContact({ email: '', name: '' });
        setSuccess('Emergency contact added successfully');
      } else {
        setError(data.error || 'Failed to add emergency contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsContactLoading(false);
    }
  };

  const handleRemoveContact = async (contactEmail) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) {
      return;
    }

    setIsContactLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/emergency-contact', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          contactEmail: contactEmail
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(data.user.emergencyContacts);
        setSuccess('Emergency contact removed successfully');
      } else {
        setError(data.error || 'Failed to remove emergency contact');
      }
    } catch (error) {
      console.error('Error removing contact:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsContactLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleStatusUpdate = async (contactEmail, newStatus) => {
    setIsStatusLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/emergency-contact/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          contactEmail: contactEmail,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        const list = (data.user?.emergencyContacts) || [];
        setContacts(list);
        setSuccess(`Contact status updated to ${newStatus}`);
      } else {
        setError(data.error || 'Failed to update contact status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleRespondRequest = async (requesterEmail, action) => {
    setIsRequestLoading(true);
    setError('');
    setSuccess('');
    try {
      const resp = await fetch('/api/auth/emergency-requests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverEmail: userEmail, requesterEmail, action })
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess(`Request ${action}`);
        await fetchIncomingRequests();
      } else {
        setError(data.error || 'Failed to respond to request');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsRequestLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const safeStatus = (status || 'pending');
    switch (safeStatus) {
      case 'approved': return '#00ff88';
      case 'pending': return '#ffaa00';
      case 'rejected': return '#ff4757';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    const safeStatus = (status || 'pending');
    switch (safeStatus) {
      case 'approved': return 'fa-check-circle';
      case 'pending': return 'fa-clock';
      case 'rejected': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  };

  const requestLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0
      }
    );
  });

  const handleSendSOS = async () => {
    if (!userEmail) {
      setError('You must be logged in to send SOS');
      return;
    }
    const confirmed = window.confirm('Send SOS? Your current location and distress signal will be sent to all approved emergency contacts.');
    if (!confirmed) return;
    setIsSOSLoading(true);
    setError('');
    setSuccess('');
    try {
      const { lat, lon, accuracy } = await requestLocation();
      const resp = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, latitude: lat, longitude: lon, accuracy })
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess(data.message || 'SOS sent successfully');
      } else {
        setError(data.error || 'Failed to send SOS');
      }
    } catch (e) {
      console.error('SOS error:', e);
      setError(e.message || 'Failed to get location / send SOS');
    } finally {
      setIsSOSLoading(false);
    }
  };

  // Filter contacts by status
  const approvedContacts = contacts.filter(contact => contact.status === 'approved');
  const pendingContacts = contacts.filter(contact => contact.status === 'pending');
  const rejectedContacts = contacts.filter(contact => contact.status === 'rejected');

  return (
    <div className={isPage ? 'emergency-contacts-page' : 'emergency-contacts-overlay'}>
      <div className={isPage ? 'emergency-contacts-container page' : 'emergency-contacts-container'}>
        <div className="emergency-contacts-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="header-text">
              <h2>Emergency Contacts</h2>
              <p>Manage your emergency contact list and approval status</p>
            </div>
          </div>
          {!isPage && (
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Top actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 30px' }}>
          <button
            className="add-contact-btn"
            onClick={handleSendSOS}
            disabled={isSOSLoading}
            title="Send SOS to approved contacts"
          >
            {isSOSLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bullhorn"></i>}
            <span style={{ marginLeft: '8px' }}>Send SOS</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <i className="fas fa-users"></i>
            <span>My Contacts ({contacts.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="fas fa-bell"></i>
            <span>Pending Requests ({incomingRequests.length})</span>
          </button>
        </div>

        <div className="emergency-contacts-content">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'contacts' && (
            <div className="tab-content">
              {/* Add new contact form */}
              <form className="add-contact-form" onSubmit={handleAddContact}>
                <h3>Add Emergency Contact</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactEmail">Email Address *</label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="email"
                      value={newContact.email}
                      onChange={handleInputChange}
                      placeholder="Enter emergency contact email"
                      required
                      className="contact-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contactName">Name (Optional)</label>
                    <input
                      type="text"
                      id="contactName"
                      name="name"
                      value={newContact.name}
                      onChange={handleInputChange}
                      placeholder="Enter contact name"
                      className="contact-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`add-contact-btn ${isContactLoading ? 'loading' : ''}`}
                  disabled={isContactLoading}
                >
                  {isContactLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Add Contact
                    </>
                  )}
                </button>
              </form>

              {/* Existing contacts list */}
              <div className="contacts-list">
                <h3>Your Emergency Contacts ({contacts.length})</h3>
                {contacts.length === 0 ? (
                  <div className="no-contacts">
                    <i className="fas fa-users"></i>
                    <p>No emergency contacts added yet</p>
                    <p>Add contacts above to get started</p>
                  </div>
                ) : (
                  <div className="contacts-grid">
                    {contacts.map((contact, index) => (
                      <div key={index} className="contact-card">
                        <div className="contact-info">
                          <div className="contact-email">
                            <i className="fas fa-envelope"></i>
                            {contact.email}
                          </div>
                          {contact.name && (
                            <div className="contact-name">
                              <i className="fas fa-user"></i>
                              {contact.name}
                            </div>
                          )}
                          {contact.addedAt && (
                            <div className="contact-date">
                              <i className="fas fa-calendar"></i>
                              Added: {new Date(contact.addedAt).toLocaleDateString()}
                            </div>
                          )}
                          <div className="contact-status">
                            <i className={`fas ${getStatusIcon(contact.status)}`} style={{ color: getStatusColor(contact.status) }}></i>
                            {(() => {
                              const s = (contact.status || 'pending'); return (
                                <span style={{ color: getStatusColor(s) }}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <button
                          className="remove-contact-btn"
                          onClick={() => handleRemoveContact(contact.email)}
                          disabled={isContactLoading}
                          title="Remove contact"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="tab-content">
              <div className="status-management">
                <h3>Incoming Requests</h3>
                <p className="section-description">
                  Approve or reject requests from users who added you as an emergency contact.
                </p>

                <div className="status-section">
                  <h4><i className="fas fa-clock"></i> Pending Requests ({incomingRequests.length})</h4>
                  {incomingRequests.length === 0 ? (
                    <div className="no-pending">
                      <i className="fas fa-check-circle"></i>
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    <div className="status-cards">
                      {incomingRequests.map((req, index) => (
                        <div key={index} className="status-card pending">
                          <div className="status-card-info">
                            <div className="contact-details">
                              <strong>{req.requesterDisplayName || req.requesterUsername || req.requesterEmail}</strong>
                              <span className="contact-email">{req.requesterEmail}</span>
                            </div>
                            <div className="status-badge pending">
                              <i className="fas fa-clock"></i>
                              Pending
                            </div>
                          </div>
                          <div className="status-actions">
                            <button
                              className="approve-btn"
                              onClick={() => handleRespondRequest(req.requesterEmail, 'approved')}
                              disabled={isRequestLoading}
                            >
                              <i className="fas fa-check"></i>
                              Accept
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleRespondRequest(req.requesterEmail, 'rejected')}
                              disabled={isRequestLoading}
                            >
                              <i className="fas fa-times"></i>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Contacts */}
                <div className="status-section">
                  <h4><i className="fas fa-check-circle"></i> Approved Contacts ({approvedContacts.length})</h4>
                  {approvedContacts.length === 0 ? (
                    <div className="no-approved">
                      <i className="fas fa-user-plus"></i>
                      <p>No approved contacts yet</p>
                    </div>
                  ) : (
                    <div className="status-cards">
                      {approvedContacts.map((contact, index) => (
                        <div key={index} className="status-card approved">
                          <div className="status-card-info">
                            <div className="contact-details">
                              <strong>{contact.name || contact.email}</strong>
                              <span className="contact-email">{contact.email}</span>
                            </div>
                            <div className="status-badge approved">
                              <i className="fas fa-check-circle"></i>
                              Approved
                            </div>
                          </div>
                          <div className="status-actions">
                            <button
                              className="revoke-btn"
                              onClick={() => handleStatusUpdate(contact.email, 'rejected')}
                              disabled={isStatusLoading}
                            >
                              <i className="fas fa-ban"></i>
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejected Contacts */}
                {rejectedContacts.length > 0 && (
                  <div className="status-section">
                    <h4><i className="fas fa-times-circle"></i> Rejected Contacts ({rejectedContacts.length})</h4>
                    <div className="status-cards">
                      {rejectedContacts.map((contact, index) => (
                        <div key={index} className="status-card rejected">
                          <div className="status-card-info">
                            <div className="contact-details">
                              <strong>{contact.name || contact.email}</strong>
                              <span className="contact-email">{contact.email}</span>
                            </div>
                            <div className="status-badge rejected">
                              <i className="fas fa-times-circle"></i>
                              Rejected
                            </div>
                          </div>
                          <div className="status-actions">
                            <button
                              className="approve-btn"
                              onClick={() => handleStatusUpdate(contact.email, 'approved')}
                              disabled={isStatusLoading}
                            >
                              <i className="fas fa-check"></i>
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
