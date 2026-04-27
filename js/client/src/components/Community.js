import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './Community.css';

const Community = () => {
    const { user, updateUsername } = useUser();
    
    const [reports, setReports] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingReport, setDeletingReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedHazardType, setSelectedHazardType] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [expandedReports, setExpandedReports] = useState(new Set());
    const [showUsernameEdit, setShowUsernameEdit] = useState(false);
    const [newUsername, setNewUsername] = useState('');

    // Form states
    const [formData, setFormData] = useState({
        hazardType: '',
        title: '',
        description: '',
        address: '',
        imageUrl: ''
    });

    const hazardTypes = [
        'Road Blockages',
        'Landslides',
        'Flooding',
        'Fire Hazards',
        'Structural Damage',
        'Power Outages',
        'Water Contamination',
        'Other'
    ];

    useEffect(() => {
        if (viewMode === 'all') {
            fetchReports();
        } else {
            fetchMyReports();
        }
    }, [currentPage, selectedHazardType, viewMode]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        const hasModalOpen = selectedReport || showCreateForm || showEditForm || showDeleteConfirm;
        document.body.style.overflow = hasModalOpen ? 'hidden' : 'unset';

        // Cleanup function to restore scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedReport, showCreateForm, showEditForm, showDeleteConfirm]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10
            });
            
            if (selectedHazardType) {
                params.append('hazardType', selectedHazardType);
            }

            const response = await fetch(`/api/community/reports?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setReports(data.reports);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReports = async () => {
        if (!user?._id) {
            console.error('No user ID available');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`/api/community/reports/user/${user._id}`);
            const data = await response.json();
            
            if (data.success) {
                setMyReports(data.reports);
                setTotalPages(Math.ceil(data.reports.length / 10));
            }
        } catch (error) {
            console.error('Error fetching my reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        
        if (!formData.hazardType || !formData.title || !formData.description || 
            !formData.address) {
            alert('Please fill in all required fields');
            return;
        }

        if (!user?._id) {
            alert('Please wait for user session to load');
            return;
        }
        
        const userId = user._id;
        const username = getUserDisplayName(user);
        
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log('Creating report with userId:', userId);
            console.log('Creating report with username:', username);
        }

        try {
            const response = await fetch('/api/community/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    username: username,
                    ...formData
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setShowCreateForm(false);
                resetForm();
                if (viewMode === 'my') {
                    fetchMyReports();
                } else {
                    fetchReports();
                }
                alert('Report created successfully!');
            } else {
                alert(data.error || 'Failed to create report');
            }
        } catch (error) {
            console.error('Error creating report:', error);
            alert('Failed to create report');
        }
    };

    const handleUpdateReport = async (e) => {
        e.preventDefault();
        
        if (!user?._id) {
            alert('Please wait for user session to load');
            return;
        }
        
        const userId = user._id;
        
        try {
            const response = await fetch(`/api/community/reports/${editingReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    title: formData.title,
                    description: formData.description,
                    hazardType: formData.hazardType
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setShowEditForm(false);
                setEditingReport(null);
                resetForm();
                if (viewMode === 'my') {
                    fetchMyReports();
                } else {
                    fetchReports();
                }
                alert('Report updated successfully!');
            } else {
                alert(data.error || 'Failed to update report');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to update report');
        }
    };

    const handleDeleteReport = async () => {
        if (!user?._id) {
            alert('Please wait for user session to load');
            return;
        }
        
        const userId = user._id;
        
        try {
            const response = await fetch(`/api/community/reports/${deletingReport._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setShowDeleteConfirm(false);
                setDeletingReport(null);
                if (viewMode === 'my') {
                    fetchMyReports();
                } else {
                    fetchReports();
                }
                alert('Report deleted successfully!');
            } else {
                alert(data.error || 'Failed to delete report');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    const resetForm = () => {
        setFormData({
            hazardType: '',
            title: '',
            description: '',
            address: '',
            imageUrl: ''
        });
    };

    const openEditForm = (report) => {
        setEditingReport(report);
        setFormData({
            hazardType: report.hazardType,
            title: report.title,
            description: report.description,
            address: report.location.address,
            imageUrl: report.imageUrl || ''
        });
        setShowEditForm(true);
    };

    const openDeleteConfirm = (report) => {
        setDeletingReport(report);
        setShowDeleteConfirm(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getHazardIcon = (hazardType) => {
        const icons = {
            'Road Blockages': '🚧',
            'Landslides': '⛰️',
            'Flooding': '🌊',
            'Fire Hazards': '🔥',
            'Structural Damage': '🏗️',
            'Power Outages': '⚡',
            'Water Contamination': '💧',
            'Other': '⚠️'
        };
        return icons[hazardType] || '⚠️';
    };

    const getHazardColor = (hazardType) => {
        const colors = {
            'Road Blockages': '#ff9800',
            'Landslides': '#8d6e63',
            'Flooding': '#2196f3',
            'Fire Hazards': '#f44336',
            'Structural Damage': '#795548',
            'Power Outages': '#ffc107',
            'Water Contamination': '#00bcd4',
            'Other': '#9e9e9e'
        };
        return colors[hazardType] || '#9e9e9e';
    };

    // Helper function to extract username from user object
    const getUserDisplayName = (userObj) => {
        if (!userObj) return 'Anonymous User';
        
        // Debug log to see what user object we're working with
        console.log('getUserDisplayName called with:', {
            userObj,
            hasEmail: !!userObj.email,
            hasUsername: !!userObj.username,
            hasProfile: !!userObj.profile,
            isAnonymous: userObj.isAnonymous
        });
        
        // Try different possible username fields in order of preference
        const possibleNames = [
            userObj.username,                    // Direct username field
            userObj.profile?.displayName,        // Profile display name
            userObj.profile?.name,              // Profile name
            userObj.name,                       // Direct name field
            userObj.displayName,                // Display name field
            userObj.email?.split('@')[0]        // Use email prefix as fallback
        ];
        
        // Find the first valid (non-empty) name
        const validName = possibleNames.find(name => name && name.trim() !== '');
        
        if (validName) {
            return validName.trim();
        }
        
        // If no valid name found, create one from user ID
        const userId = userObj._id || userObj.id;
        if (userId) {
            return `User-${userId.slice(-6)}`;
        }
        
        return 'Anonymous User';
    };

    const fetchComments = async (reportId) => {
        setLoadingComments(true);
        try {
            const response = await fetch(`/api/community/reports/${reportId}/comments`);
            const data = await response.json();
            
            if (data.success) {
                // Debug: Log the comments data to see what's being returned
                if (process.env.NODE_ENV === 'development') {
                    console.log('Fetched comments for report', reportId, ':', data.comments);
                }
                
                // Sort comments by date (newest first)
                const sortedComments = data.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setComments(prev => ({
                    ...prev,
                    [reportId]: sortedComments
                }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (reportId) => {
        if (!newComment.trim()) return;
        
        if (!user?._id) {
            alert('Please wait for user session to load');
            return;
        }
        
        const userId = user._id;
        const username = getUserDisplayName(user);
        
        // Debug: Log what we're sending
        console.log('Creating comment with:', { 
            userId, 
            username, 
            commentText: newComment,
            userObject: user,
            isLoggedIn: !!user?.email,
            isAnonymous: user?.isAnonymous
        });
        
        try {
            const response = await fetch(`/api/community/reports/${reportId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    username: username,
                    commentText: newComment
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setNewComment('');
                // Refresh comments for this report
                fetchComments(reportId);
                // Refresh the report to update comment count
                if (viewMode === 'my') {
                    fetchMyReports();
                } else {
                    fetchReports();
                }
            } else {
                alert(data.error || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        }
    };

    const handleLikeReport = async (reportId) => {
        if (!user?._id) {
            alert('Please wait for user session to load');
            return;
        }
        
        const userId = user._id;
        
        try {
            const response = await fetch(`/api/community/reports/${reportId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // Refresh the reports to update like count
                if (viewMode === 'my') {
                    fetchMyReports();
                } else {
                    fetchReports();
                }
            } else {
                alert(data.error || 'Failed to like report');
            }
        } catch (error) {
            console.error('Error liking report:', error);
            alert('Failed to like report');
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            alert('Please enter a username');
            return;
        }

        const success = await updateUsername(newUsername.trim());
        if (success) {
            setShowUsernameEdit(false);
            setNewUsername('');
            alert('Username updated successfully!');
        } else {
            alert('Failed to update username');
        }
    };



    return (
        <div className="community-container">
            <div className="community-header">
                <h1>Community Hazard Reports</h1>
                <p>Stay informed about local hazards and contribute to community safety</p>
                
                {/* Username Display and Edit */}
                <div className="username-section">
                    <div className="current-username">
                        <i className="fas fa-user"></i>
                        <span>Posting as: <strong>{getUserDisplayName(user)}</strong></span>
                        {user?.isAnonymous && (
                            <button 
                                className="edit-username-btn"
                                onClick={() => {
                                    setShowUsernameEdit(true);
                                    setNewUsername(getUserDisplayName(user));
                                }}
                                title="Change your display name"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                        )}
                    </div>
                    
                    {showUsernameEdit && (
                        <div className="username-edit-form">
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Enter your display name"
                                maxLength={50}
                            />
                            <button 
                                className="save-username-btn"
                                onClick={handleUpdateUsername}
                            >
                                <i className="fas fa-check"></i> Save
                            </button>
                            <button 
                                className="cancel-username-btn"
                                onClick={() => {
                                    setShowUsernameEdit(false);
                                    setNewUsername('');
                                }}
                            >
                                <i className="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Toggle and Filters */}
            <div className="community-controls">
                <div className="controls-left">
                    <div className="view-mode-toggle">
                        <button 
                            className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                            onClick={() => setViewMode('all')}
                        >
                            <i className="fas fa-globe"></i>
                            Community Reports
                        </button>
                        <button 
                            className={`toggle-btn ${viewMode === 'my' ? 'active' : ''}`}
                            onClick={() => setViewMode('my')}
                        >
                            <i className="fas fa-user"></i>
                            My Reports
                        </button>
                    </div>
                    
                    <div className="community-filters">
                        <select 
                            value={selectedHazardType} 
                            onChange={(e) => setSelectedHazardType(e.target.value)}
                            className="hazard-filter"
                        >
                            <option value="">All Hazard Types</option>
                            {hazardTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="controls-right">
                    <button 
                        className="create-report-btn-discrete"
                        onClick={() => setShowCreateForm(true)}
                        title="Create New Report"
                    >
                        <i className="fas fa-plus"></i>
                        <span>New Report</span>
                    </button>
                </div>
            </div>

            {/* Reports List */}
            <div className="reports-container">
                {loading ? (
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading reports...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="no-reports">
                        <i className="fas fa-info-circle"></i>
                        <p>No reports found. Be the first to create a hazard report!</p>
                    </div>
                ) : (
                    <>
                        <div className="reports-vertical">
                            {(viewMode === 'all' ? reports : myReports).map((report, index) => (
                                <div 
                                    key={report._id} 
                                    className="report-card-vertical clickable-report"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    {/* Debug indicator - remove in production */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '10px'}}>
                                            Report #{index + 1} - ID: {report._id.slice(-6)}
                                        </div>
                                    )}
                                    <div className="report-header">
                                        <div className="report-meta">
                                            <span 
                                                className="hazard-badge"
                                                style={{ backgroundColor: getHazardColor(report.hazardType) }}
                                            >
                                                {getHazardIcon(report.hazardType)} {report.hazardType}
                                            </span>
                                            <span className="report-date">{formatDate(report.createdAt)}</span>
                                        </div>
                                        <div className="report-author">
                                            <i className="fas fa-user"></i>
                                            <span>{getUserDisplayName(report.user) || report.username || 'Unknown User'}</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="report-title">{report.title}</h3>
                                    <div className="report-description-container">
                                        <p className="report-description">
                                            {expandedReports.has(report._id) || report.description.length <= 200 
                                                ? report.description 
                                                : report.description.substring(0, 200) + '...'}
                                        </p>
                                        {report.description.length > 200 && (
                                            <button 
                                                className="read-more-btn"
                                                onClick={() => {
                                                    const newExpanded = new Set(expandedReports);
                                                    if (expandedReports.has(report._id)) {
                                                        newExpanded.delete(report._id);
                                                    } else {
                                                        newExpanded.add(report._id);
                                                    }
                                                    setExpandedReports(newExpanded);
                                                }}
                                            >
                                                {expandedReports.has(report._id) ? 'Read Less' : 'Read More'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="report-location">
                                        <i className="fas fa-map-marker-alt"></i>
                                        {report.location.address}
                                    </div>
                                    
                                    {report.imageUrl && (
                                        <div className="report-image">
                                            <img src={report.imageUrl} alt="Hazard" />
                                        </div>
                                    )}
                                    
                                    <div className="report-stats">
                                        <span><i className="fas fa-comments"></i> {report.comments || 0} Comments</span>
                                        <button 
                                            className="like-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                handleLikeReport(report._id);
                                            }}
                                            title="Like this report"
                                        >
                                            <i className="fas fa-thumbs-up"></i> {report.likes || 0} Likes
                                        </button>
                                    </div>
                                    
                                    {/* Comments Section */}
                                    <div className="comments-section">
                                        {/* Debug indicator - remove in production */}
                                        {process.env.NODE_ENV === 'development' && (
                                            <div style={{fontSize: '0.7rem', color: 'rgba(255,193,7,0.6)', marginBottom: '8px'}}>
                                                Comments for Report #{index + 1}
                                            </div>
                                        )}
                                        <div className="comments-header">
                                            <button 
                                                className="toggle-comments-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    if (!comments[report._id]) {
                                                        fetchComments(report._id);
                                                    } else {
                                                        setComments(prev => {
                                                            const newComments = { ...prev };
                                                            delete newComments[report._id];
                                                            return newComments;
                                                        });
                                                    }
                                                }}
                                            >
                                                <i className="fas fa-comments"></i>
                                                {comments[report._id] ? 'Hide Comments' : 'Show Comments'}
                                            </button>
                                        </div>
                                        
                                        {comments[report._id] && (
                                            <div className="comments-container">
                                                {loadingComments ? (
                                                    <div className="loading-comments">
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                        Loading comments...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="comments-list">
                                                            {comments[report._id].map((comment) => (
                                                                <div key={comment._id} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">
                                                                            {getUserDisplayName(comment.user) || comment.username || 'Unknown User'}
                                                                        </span>
                                                                        <span className="comment-date">
                                                                            {formatDate(comment.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="comment-text">{comment.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        <div className="add-comment">
                                                            <textarea
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                placeholder="Add a comment..."
                                                                rows="2"
                                                            />
                                                            <button 
                                                                className="add-comment-btn"
                                                                onClick={() => handleAddComment(report._id)}
                                                                disabled={!newComment.trim()}
                                                            >
                                                                <i className="fas fa-paper-plane"></i>
                                                                Post
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Show edit/delete buttons only in "My Reports" view */}
                                    {viewMode === 'my' && (
                                        <div className="report-actions">
                                            {/* Debug indicator - remove in production */}
                                            {process.env.NODE_ENV === 'development' && (
                                                <div style={{fontSize: '0.7rem', color: 'rgba(0,212,255,0.6)', marginBottom: '8px'}}>
                                                    Actions for Report #{index + 1}
                                                </div>
                                            )}
                                            <button 
                                                className="edit-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    openEditForm(report);
                                                }}
                                            >
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    openDeleteConfirm(report);
                                                }}
                                            >
                                                <i className="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="page-btn"
                                >
                                    <i className="fas fa-chevron-left"></i> Previous
                                </button>
                                
                                <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="page-btn"
                                >
                                    Next <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Report Modal */}
            {showCreateForm && (
                <div 
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateForm(false);
                            resetForm();
                        }
                    }}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Create Hazard Report</h2>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    resetForm();
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateReport} className="report-form">
                            <div className="form-group">
                                <label>Hazard Type *</label>
                                <select 
                                    value={formData.hazardType}
                                    onChange={(e) => setFormData({...formData, hazardType: e.target.value})}
                                    required
                                >
                                    <option value="">Select Hazard Type</option>
                                    {hazardTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Title *</label>
                                <input 
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Brief description of the hazard"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Detailed description of the hazard and its impact"
                                    rows="4"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Location Address *</label>
                                <input 
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    placeholder="Full address or location description"
                                    required
                                />
                            </div>
                            
                            
                            
                            <div className="form-group">
                                <label>Image URL (Optional)</label>
                                <input 
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => {
                                    setShowCreateForm(false);
                                    resetForm();
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Create Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Report Modal */}
            {showEditForm && (
                <div 
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEditForm(false);
                            setEditingReport(null);
                            resetForm();
                        }
                    }}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit Hazard Report</h2>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingReport(null);
                                    resetForm();
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdateReport} className="report-form">
                            <div className="form-group">
                                <label>Hazard Type *</label>
                                <select 
                                    value={formData.hazardType}
                                    onChange={(e) => setFormData({...formData, hazardType: e.target.value})}
                                    required
                                >
                                    {hazardTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label>Title *</label>
                                <input 
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="4"
                                    required
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => {
                                    setShowEditForm(false);
                                    setEditingReport(null);
                                    resetForm();
                                }}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Update Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteConfirm(false);
                            setDeletingReport(null);
                        }
                    }}
                >
                    <div className="modal-content delete-confirm">
                        <div className="modal-header">
                            <h2>Confirm Deletion</h2>
                        </div>
                        
                        <div className="delete-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>Are you sure you want to delete this report?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletingReport(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="delete-confirm-btn"
                                onClick={handleDeleteReport}
                            >
                                Delete Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Report Modal */}
            {selectedReport && (
                <div 
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedReport(null);
                            setComments(prev => {
                                const newComments = { ...prev };
                                delete newComments[selectedReport._id];
                                return newComments;
                            });
                        }
                    }}
                >
                    <div className="modal-content view-report">
                        <div className="modal-header">
                            <h2>Hazard Report Details</h2>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setSelectedReport(null);
                                    setComments(prev => {
                                        const newComments = { ...prev };
                                        delete newComments[selectedReport._id];
                                        return newComments;
                                    });
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="report-details-scrollable">
                            <div className="report-header">
                                <div className="report-meta">
                                    <span 
                                        className="hazard-badge"
                                        style={{ backgroundColor: getHazardColor(selectedReport.hazardType) }}
                                    >
                                        {getHazardIcon(selectedReport.hazardType)} {selectedReport.hazardType}
                                    </span>
                                    <span className="report-date">{formatDate(selectedReport.createdAt)}</span>
                                </div>
                                <div className="report-author">
                                    <i className="fas fa-user"></i>
                                    <span>{getUserDisplayName(selectedReport.user) || selectedReport.username || 'Unknown User'}</span>
                                </div>
                            </div>
                            
                            <h3 className="report-title">{selectedReport.title}</h3>
                            <p className="report-description">{selectedReport.description}</p>
                            
                            <div className="report-location">
                                <i className="fas fa-map-marker-alt"></i>
                                {selectedReport.location.address}
                            </div>
                            
                            {selectedReport.imageUrl && (
                                <div className="report-image">
                                    <img src={selectedReport.imageUrl} alt="Hazard" />
                                </div>
                            )}
                            
                            <div className="report-stats">
                                <span><i className="fas fa-comments"></i> {selectedReport.comments || 0} Comments</span>
                                <span><i className="fas fa-thumbs-up"></i> {selectedReport.likes || 0} Likes</span>
                            </div>
                        </div>
                        
                        {/* Comments Section in Modal */}
                        <div className="comments-section">
                            <div className="comments-header">
                                <button 
                                    className="toggle-comments-btn"
                                    onClick={() => {
                                        if (!comments[selectedReport._id]) {
                                            fetchComments(selectedReport._id);
                                        } else {
                                            setComments(prev => {
                                                const newComments = { ...prev };
                                                delete newComments[selectedReport._id];
                                                return newComments;
                                            });
                                        }
                                    }}
                                >
                                    <i className="fas fa-comments"></i>
                                    {comments[selectedReport._id] ? 'Hide Comments' : 'Show Comments'}
                                </button>
                            </div>
                            
                            {comments[selectedReport._id] && (
                                <div className="comments-container">
                                    {loadingComments ? (
                                        <div className="loading-comments">
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Loading comments...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="comments-list">
                                                {comments[selectedReport._id].map((comment) => (
                                                    <div key={comment._id} className="comment-item">
                                                        <div className="comment-header">
                                                            <span className="comment-author">
                                                                {getUserDisplayName(comment.user) || comment.username || 'Unknown User'}
                                                            </span>
                                                            <span className="comment-date">
                                                                {formatDate(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="comment-text">{comment.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="add-comment">
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    rows="2"
                                                />
                                                <button 
                                                    className="add-comment-btn"
                                                    onClick={() => handleAddComment(selectedReport._id)}
                                                    disabled={!newComment.trim()}
                                                >
                                                    <i className="fas fa-paper-plane"></i>
                                                    Post
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="close-btn-modal"
                                onClick={() => {
                                    setSelectedReport(null);
                                    setComments(prev => {
                                        const newComments = { ...prev };
                                        delete newComments[selectedReport._id];
                                        return newComments;
                                    });
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
