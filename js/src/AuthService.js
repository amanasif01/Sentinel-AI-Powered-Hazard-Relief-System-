const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

class AuthService {
    constructor(dbConnection) {
        this.db = dbConnection.getDatabase();
        this.usersCollection = this.db.collection('user_accounts');
        this.reportsCollection = this.db.collection('reports');
        this.commentsCollection = this.db.collection('comments');
    }

    async createIndexes() {
        try {
            console.log('🔥 STARTING DATABASE SETUP...');
            console.log('🔥 Database name:', this.db.databaseName);
            console.log('🔥 Collection name: user_accounts');
            
            // Create indexes for better performance (DO NOT DROP EXISTING DATA)
            console.log('🔥 Creating database indexes...');
            
            // Create indexes with error handling for existing indexes
            try {
                await this.usersCollection.createIndex({ email: 1 }, { unique: true });
                console.log('✅ Email index created');
            } catch (error) {
                console.log('ℹ️ Email index already exists or error:', error.message);
            }
            
            try {
                await this.usersCollection.createIndex({ sessionId: 1 }, { unique: true, sparse: true });
                console.log('✅ SessionId index created');
            } catch (error) {
                console.log('ℹ️ SessionId index already exists or error:', error.message);
            }
            
            try {
                await this.usersCollection.createIndex({ username: 1 }, { unique: true });
                console.log('✅ Username index created');
            } catch (error) {
                console.log('ℹ️ Username index already exists or error:', error.message);
            }
            
            try {
                await this.usersCollection.createIndex({ createdAt: -1 });
                console.log('✅ CreatedAt index created');
            } catch (error) {
                console.log('ℹ️ CreatedAt index already exists or error:', error.message);
            }
            
            // Reports collection indexes
            try {
                await this.reportsCollection.createIndex({ userId: 1 });
                console.log('✅ Reports userId index created');
            } catch (error) {
                console.log('ℹ️ Reports userId index already exists or error:', error.message);
            }
            
            try {
                await this.reportsCollection.createIndex({ hazardType: 1 });
                console.log('✅ Reports hazardType index created');
            } catch (error) {
                console.log('ℹ️ Reports hazardType index already exists or error:', error.message);
            }
            
            try {
                await this.reportsCollection.createIndex({ createdAt: -1 });
                console.log('✅ Reports createdAt index created');
            } catch (error) {
                console.log('ℹ️ Reports createdAt index already exists or error:', error.message);
            }
            
            // Comments collection indexes
            try {
                await this.commentsCollection.createIndex({ reportId: 1 });
                console.log('✅ Comments reportId index created');
            } catch (error) {
                console.log('ℹ️ Comments reportId index already exists or error:', error.message);
            }
            
            try {
                await this.commentsCollection.createIndex({ userId: 1 });
                console.log('✅ Comments userId index created');
            } catch (error) {
                console.log('ℹ️ Comments userId index already exists or error:', error.message);
            }
            
            try {
                await this.commentsCollection.createIndex({ createdAt: -1 });
                console.log('✅ Comments createdAt index created');
            } catch (error) {
                console.log('ℹ️ Comments createdAt index already exists or error:', error.message);
            }
            
            // Test the collection exists and is accessible
            const testCount = await this.usersCollection.countDocuments();
            console.log('✅ Auth service indexes created successfully!');
            console.log('✅ Test: Collection accessible, current user count:', testCount);
        } catch (error) {
            console.error('❌ Error creating auth service indexes:', error);
        }
    }

    async registerUser(email, password, username) {
        try {
            console.log('🔍 REGISTER: Input data:', { email, username });
            
            // Check if user already exists
            const existingUser = await this.usersCollection.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return {
                    success: false,
                    error: 'User with this email already exists'
                };
            }

            // Check if username already exists
            const existingUsername = await this.usersCollection.findOne({ username: username.toLowerCase() });
            if (existingUsername) {
                return {
                    success: false,
                    error: 'Username already taken'
                };
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user
            const user = {
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                createdAt: new Date(),
                emergencyContacts: [],
                profile: {
                    displayName: username,
                    avatar: null,
                    preferences: {}
                }
            };

            console.log('🔍 REGISTER: User object being saved:', user);
            const result = await this.usersCollection.insertOne(user);
            console.log('🔍 REGISTER: User saved with ID:', result.insertedId);
            
            // Verify the user was saved correctly
            const savedUser = await this.usersCollection.findOne({ _id: result.insertedId });
            console.log('🔍 REGISTER: User retrieved from DB:', savedUser);
            
            // Also test finding by email to make sure it works
            const userByEmail = await this.usersCollection.findOne({ email: email.toLowerCase() });
            console.log('🔍 REGISTER: User found by email:', userByEmail);
            
            // Check total users in collection
            const totalUsers = await this.usersCollection.countDocuments();
            console.log('🔍 REGISTER: Total users in collection:', totalUsers);
            
            const response = {
                success: true,
                message: 'User registered successfully',
                userId: result.insertedId.toString(),
                email: user.email,
                username: user.username
            };
            
            console.log('🔍 REGISTER: Sending response:', response);
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'Failed to register user'
            };
        }
    }

    async loginUser(email, password) {
        try {
            console.log('🔍 LOGIN: Looking for user with email:', email);
            
            const user = await this.usersCollection.findOne({ email: email.toLowerCase() });
            if (!user) {
                console.log('🔍 LOGIN: No user found with email:', email);
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            console.log('🔍 LOGIN: Found user in database:', {
                _id: user._id,
                email: user.email,
                username: user.username,
                hasUsername: !!user.username,
                allFields: Object.keys(user)
            });

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                console.log('🔍 LOGIN: Invalid password for user:', email);
                return {
                    success: false,
                    error: 'Invalid email or password'
                };
            }

            const response = {
                success: true,
                message: 'Login successful',
                userId: user._id.toString(),
                email: user.email,
                username: user.username,
                user: {
                    _id: user._id.toString(),
                    email: user.email,
                    username: user.username,
                    profile: user.profile,
                    emergencyContacts: user.emergencyContacts,
                    createdAt: user.createdAt
                }
            };

            console.log('🔍 LOGIN: Sending response:', response);
            return response;
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Failed to login user'
            };
        }
    }



    async getUserProfile(email) {
        try {
            const user = await this.usersCollection.findOne(
                { email: email.toLowerCase() },
                { projection: { password: 0 } }
            );

            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            return {
                success: true,
                profile: user
            };
        } catch (error) {
            console.error('Get profile error:', error);
            return {
                success: false,
                error: 'Failed to get user profile'
            };
        }
    }

    async getUserById(userId) {
        try {
            const user = await this.usersCollection.findOne(
                { _id: new ObjectId(userId) },
                { projection: { password: 0 } }
            );

            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            return {
                success: true,
                user: user
            };
        } catch (error) {
            console.error('Get user by ID error:', error);
            return {
                success: false,
                error: 'Failed to get user'
            };
        }
    }

    async addEmergencyContact(email, contactEmail, contactName) {
        try {
            // Check if contact already exists
            const user = await this.usersCollection.findOne({ email: email.toLowerCase() });
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Check if contact already exists
            const existingContact = user.emergencyContacts?.find(contact => 
                contact.email.toLowerCase() === contactEmail.toLowerCase()
            );

            if (existingContact) {
                return {
                    success: false,
                    error: 'Emergency contact already exists'
                };
            }

            const result = await this.usersCollection.updateOne(
                { email: email.toLowerCase() },
                {
                    $push: {
                        emergencyContacts: {
                            email: contactEmail.toLowerCase(),
                            name: contactName || contactEmail.split('@')[0],
                            addedAt: new Date(),
                            status: 'pending', // New: approval status
                            requestedBy: email.toLowerCase() // New: who requested this contact
                        }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: 'Failed to add emergency contact'
                };
            }

            // Get updated user data
            const updatedUser = await this.usersCollection.findOne({ email: email.toLowerCase() });

            return {
                success: true,
                message: 'Emergency contact added successfully',
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    emergencyContacts: updatedUser.emergencyContacts
                }
            };
        } catch (error) {
            console.error('Add emergency contact error:', error);
            return {
                success: false,
                error: 'Failed to add emergency contact'
            };
        }
    }

    async removeEmergencyContact(email, contactEmail) {
        try {
            const result = await this.usersCollection.updateOne(
                { email: email.toLowerCase() },
                {
                    $pull: {
                        emergencyContacts: { email: contactEmail.toLowerCase() }
                    }
                }
            );

            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: 'Contact not found or user not found'
                };
            }

            // Get updated user data
            const updatedUser = await this.usersCollection.findOne({ email: email.toLowerCase() });

            return {
                success: true,
                message: 'Emergency contact removed successfully',
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    emergencyContacts: updatedUser.emergencyContacts
                }
            };
        } catch (error) {
            console.error('Remove emergency contact error:', error);
            return {
                success: false,
                error: 'Failed to remove emergency contact'
            };
        }
    }

    // Session Management Methods
    async createAnonymousSession(username = null) {
        try {
            const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const displayName = username || 'Anonymous User';
            
            const sessionUser = {
                sessionId: sessionId,
                username: displayName,
                profile: {
                    displayName: displayName
                },
                isAnonymous: true,
                createdAt: new Date(),
                lastActive: new Date()
            };

            const result = await this.usersCollection.insertOne(sessionUser);
            
            return {
                success: true,
                user: {
                    _id: result.insertedId,
                    sessionId: sessionId,
                    username: displayName,
                    profile: {
                        displayName: displayName
                    },
                    isAnonymous: true
                }
            };
        } catch (error) {
            console.error('Create anonymous session error:', error);
            return {
                success: false,
                error: 'Failed to create anonymous session'
            };
        }
    }

    async getSessionUser(sessionId) {
        try {
            const user = await this.usersCollection.findOne(
                { sessionId: sessionId },
                { projection: { username: 1, profile: 1, isAnonymous: 1, sessionId: 1 } }
            );
            
            if (!user) {
                return {
                    success: false,
                    error: 'Session not found'
                };
            }

            // Update last active time
            await this.usersCollection.updateOne(
                { sessionId: sessionId },
                { $set: { lastActive: new Date() } }
            );

            return {
                success: true,
                user: user
            };
        } catch (error) {
            console.error('Get session user error:', error);
            return {
                success: false,
                error: 'Failed to get session user'
            };
        }
    }

    async updateSessionUsername(sessionId, newUsername) {
        try {
            const result = await this.usersCollection.updateOne(
                { sessionId: sessionId },
                { 
                    $set: { 
                        username: newUsername,
                        'profile.displayName': newUsername,
                        lastActive: new Date()
                    } 
                }
            );

            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: 'Session not found'
                };
            }

            return {
                success: true,
                message: 'Username updated successfully'
            };
        } catch (error) {
            console.error('Update session username error:', error);
            return {
                success: false,
                error: 'Failed to update username'
            };
        }
    }

    async createReport(userId, reportData) {
        try {
            // Handle demo user IDs (they start with 'demo-user-')
            let finalUserId;
            let username = reportData.username || 'Anonymous User'; // Use username from request data
            
            if (userId.startsWith('session-')) {
                // Session-based user
                finalUserId = userId;
                // Get username from session
                const sessionUser = await this.getSessionUser(userId);
                if (sessionUser.success) {
                    username = sessionUser.user.username;
                }
            } else if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
                // Use the username from request data, or default to 'Demo User'
                username = reportData.username || 'Demo User';
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                    // If no username provided in request, get from database
                    if (!reportData.username) {
                        const user = await this.usersCollection.findOne(
                            { _id: finalUserId },
                            { projection: { username: 1, profile: 1 } }
                        );
                        if (user) {
                            username = user.profile?.displayName || user.username || 'Anonymous User';
                        }
                    }
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }
            
            const report = {
                userId: finalUserId,
                username: username, // Store username directly in report
                hazardType: reportData.hazardType,
                title: reportData.title,
                description: reportData.description,
                location: {
                    address: reportData.address
                },
                imageUrl: reportData.imageUrl || null,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                likes: 0,
                comments: 0,
                likedBy: []
            };

            const result = await this.reportsCollection.insertOne(report);
            
            return {
                success: true,
                message: 'Report created successfully',
                reportId: result.insertedId
            };
        } catch (error) {
            console.error('Create report error:', error);
            return {
                success: false,
                error: `Failed to create report: ${error.message}`
            };
        }
    }

    async getUserReports(userId) {
        try {
            // Handle demo user IDs (they start with 'demo-user-')
            let finalUserId;
            if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }
            
            const reports = await this.reportsCollection
                .find({ userId: finalUserId })
                .sort({ createdAt: -1 })
                .toArray();

            // Get user information
            let user;
            if (userId.startsWith('demo-user-')) {
                user = {
                    username: 'Demo User',
                    profile: { displayName: 'Demo User' }
                };
            } else {
                user = await this.usersCollection.findOne(
                    { _id: finalUserId },
                    { projection: { username: 1, profile: 1 } }
                );
            }

            // Add user information to each report
            const reportsWithUser = reports.map(report => {
                // Use stored username if available and user lookup failed
                let reportUser = user;
                if (!reportUser && report.username) {
                    reportUser = {
                        username: report.username,
                        profile: { displayName: report.username }
                    };
                }
                
                return {
                    ...report,
                    user: reportUser || { username: 'Unknown User', profile: { displayName: 'Unknown User' } }
                };
            });

            return {
                success: true,
                reports: reportsWithUser
            };
        } catch (error) {
            console.error('Get user reports error:', error);
            return {
                success: false,
                error: 'Failed to get user reports'
            };
        }
    }

    async updateReport(reportId, userId, updateData) {
        try {
            // Handle demo user IDs (they start with 'demo-user-')
            let finalUserId;
            if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }
            
            const result = await this.reportsCollection.updateOne(
                { _id: new ObjectId(reportId), userId: finalUserId },
                {
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return {
                    success: false,
                    error: 'Report not found or unauthorized'
                };
            }

            return {
                success: true,
                message: 'Report updated successfully'
            };
        } catch (error) {
            console.error('Update report error:', error);
            return {
                success: false,
                error: 'Failed to update report'
            };
        }
    }

    async deleteReport(reportId, userId) {
        try {
            // Handle different user ID types
            let finalUserId;
            if (userId.startsWith('session-')) {
                // Session-based user
                finalUserId = userId;
            } else if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }
            
            // First, check if the report exists and belongs to the user
            const report = await this.reportsCollection.findOne({
                _id: new ObjectId(reportId),
                userId: finalUserId
            });

            if (!report) {
                return {
                    success: false,
                    error: 'Report not found or unauthorized'
                };
            }

            // Delete the report
            const result = await this.reportsCollection.deleteOne({
                _id: new ObjectId(reportId),
                userId: finalUserId
            });

            if (result.deletedCount === 0) {
                return {
                    success: false,
                    error: 'Failed to delete report'
                };
            }

            // Delete all associated comments
            const commentDeleteResult = await this.commentsCollection.deleteMany({ 
                reportId: new ObjectId(reportId) 
            });

            // Update the report's comment count to 0 (since we're deleting the report anyway)
            await this.reportsCollection.updateOne(
                { _id: new ObjectId(reportId) },
                { $set: { comments: 0 } }
            );

            console.log(`Deleted report ${reportId} and ${commentDeleteResult.deletedCount} associated comments`);

            return {
                success: true,
                message: 'Report and all associated comments deleted successfully',
                deletedComments: commentDeleteResult.deletedCount
            };
        } catch (error) {
            console.error('Delete report error:', error);
            return {
                success: false,
                error: 'Failed to delete report'
            };
        }
    }

    // Utility method to sync comment counts for a report
    async syncCommentCount(reportId) {
        try {
            const commentCount = await this.commentsCollection.countDocuments({
                reportId: new ObjectId(reportId)
            });

            await this.reportsCollection.updateOne(
                { _id: new ObjectId(reportId) },
                { $set: { comments: commentCount } }
            );

            return commentCount;
        } catch (error) {
            console.error('Sync comment count error:', error);
            return 0;
        }
    }

    async getAllReports(page = 1, limit = 10, hazardType = null) {
        try {
            const filter = hazardType ? { hazardType: hazardType } : {};
            const skip = (page - 1) * limit;

            const [reports, total] = await Promise.all([
                this.reportsCollection
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                this.reportsCollection.countDocuments(filter)
            ]);

            // Populate user information for each report
            const reportsWithUsers = await Promise.all(
                reports.map(async (report) => {
                    try {
                        let user;
                        const userIdStr = report.userId.toString();
                        
                        if (userIdStr.startsWith('demo-user-')) {
                            // For demo users, use stored username or default
                            user = {
                                username: report.username || 'Demo User',
                                profile: { displayName: report.username || 'Demo User' }
                            };
                        } else {
                            // For real users, try to find them in the database
                            try {
                                user = await this.usersCollection.findOne(
                                    { _id: new ObjectId(userIdStr) },
                                    { projection: { username: 1, profile: 1 } }
                                );
                                
                                // If user not found in database, use stored username
                                if (!user && report.username) {
                                    user = {
                                        username: report.username,
                                        profile: { displayName: report.username }
                                    };
                                }
                            } catch (objectIdError) {
                                console.error('Invalid ObjectId for user lookup:', userIdStr);
                                user = null;
                                
                                // If ObjectId is invalid but we have a stored username, use it
                                if (report.username) {
                                    user = {
                                        username: report.username,
                                        profile: { displayName: report.username }
                                    };
                                }
                            }
                        }
                        
                        return {
                            ...report,
                            user: user || { username: 'Unknown User', profile: { displayName: 'Unknown User' } }
                        };
                    } catch (error) {
                        console.error('Error fetching user for report:', error);
                        return {
                            ...report,
                            user: { username: 'Unknown User', profile: { displayName: 'Unknown User' } }
                        };
                    }
                })
            );

            return {
                success: true,
                reports: reportsWithUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Get all reports error:', error);
            return {
                success: false,
                error: 'Failed to get reports'
            };
        }
    }

    async addComment(reportId, userId, commentText, username = null) {
        try {
            // Handle different user ID types
            let finalUserId;
            let finalUsername = username;
            
            if (userId.startsWith('session-')) {
                // Session-based user
                finalUserId = userId;
                // Get username from session if not provided
                if (!finalUsername) {
                    const sessionUser = await this.getSessionUser(userId);
                    if (sessionUser.success) {
                        finalUsername = sessionUser.user.username;
                    }
                }
            } else if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }
            
            const comment = {
                reportId: new ObjectId(reportId),
                userId: finalUserId,
                username: finalUsername, // Store the username directly
                text: commentText,
                createdAt: new Date()
            };

            const result = await this.commentsCollection.insertOne(comment);

            // Update report comment count
            await this.reportsCollection.updateOne(
                { _id: new ObjectId(reportId) },
                { $inc: { comments: 1 } }
            );

            return {
                success: true,
                message: 'Comment added successfully',
                commentId: result.insertedId
            };
        } catch (error) {
            console.error('Add comment error:', error);
            return {
                success: false,
                error: 'Failed to add comment'
            };
        }
    }

    async deleteComment(commentId, userId) {
        try {
            // Handle different user ID types
            let finalUserId;
            if (userId.startsWith('session-')) {
                finalUserId = userId;
            } else if (userId.startsWith('demo-user-')) {
                finalUserId = userId;
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }

            // Find the comment and get the reportId
            const comment = await this.commentsCollection.findOne({
                _id: new ObjectId(commentId),
                userId: finalUserId
            });

            if (!comment) {
                return {
                    success: false,
                    error: 'Comment not found or unauthorized'
                };
            }

            // Delete the comment
            const result = await this.commentsCollection.deleteOne({
                _id: new ObjectId(commentId),
                userId: finalUserId
            });

            if (result.deletedCount === 0) {
                return {
                    success: false,
                    error: 'Failed to delete comment'
                };
            }

            // Update the report's comment count
            await this.reportsCollection.updateOne(
                { _id: comment.reportId },
                { $inc: { comments: -1 } }
            );

            return {
                success: true,
                message: 'Comment deleted successfully'
            };
        } catch (error) {
            console.error('Delete comment error:', error);
            return {
                success: false,
                error: 'Failed to delete comment'
            };
        }
    }

    async getReportComments(reportId) {
        try {
            const comments = await this.commentsCollection
                .find({ reportId: new ObjectId(reportId) })
                .sort({ createdAt: 1 })
                .toArray();

            // Populate user information for each comment
            const commentsWithUsers = await Promise.all(
                comments.map(async (comment) => {
                    try {
                        let user;
                        if (comment.userId.toString().startsWith('session-')) {
                            // For session users, use the stored username or default
                            user = {
                                username: comment.username || 'Anonymous User',
                                profile: { displayName: comment.username || 'Anonymous User' }
                            };
                        } else if (comment.userId.toString().startsWith('demo-user-')) {
                            // For demo users, use the stored username or default
                            user = {
                                username: comment.username || 'Demo User',
                                profile: { displayName: comment.username || 'Demo User' }
                            };
                        } else {
                            console.log('Looking up user for comment:', comment.userId);
                            user = await this.usersCollection.findOne(
                                { _id: comment.userId },
                                { projection: { username: 1, profile: 1, email: 1 } }
                            );
                            console.log('Found user for comment:', user);
                            
                            // If user not found in database, use stored username
                            if (!user && comment.username) {
                                user = {
                                    username: comment.username,
                                    profile: { displayName: comment.username }
                                };
                            }
                        }
                        
                        return {
                            ...comment,
                            user: user || { 
                                username: comment.username || 'Unknown User', 
                                profile: { displayName: comment.username || 'Unknown User' } 
                            }
                        };
                    } catch (error) {
                        console.error('Error fetching user for comment:', error);
                        return {
                            ...comment,
                            user: { 
                                username: comment.username || 'Unknown User', 
                                profile: { displayName: comment.username || 'Unknown User' } 
                            }
                        };
                    }
                })
            );

            return {
                success: true,
                comments: commentsWithUsers
            };
        } catch (error) {
            console.error('Get comments error:', error);
            return {
                success: false,
                error: 'Failed to get comments'
            };
        }
    }

    async likeReport(reportId, userId) {
        try {
            // Handle demo user IDs (they start with 'demo-user-')
            let finalUserId;
            if (userId.startsWith('demo-user-')) {
                finalUserId = userId; // Keep as string for demo users
            } else {
                try {
                    finalUserId = new ObjectId(userId);
                } catch (error) {
                    console.error('Invalid ObjectId:', userId);
                    return {
                        success: false,
                        error: 'Invalid user ID format'
                    };
                }
            }

            const reportObjectId = new ObjectId(reportId);
            
            // Check if user has already liked this report
            const existingLike = await this.reportsCollection.findOne({
                _id: reportObjectId,
                likedBy: finalUserId
            });

            if (existingLike) {
                // Unlike: remove user from likedBy array and decrement likes
                await this.reportsCollection.updateOne(
                    { _id: reportObjectId },
                    { 
                        $pull: { likedBy: finalUserId },
                        $inc: { likes: -1 }
                    }
                );
                
                return {
                    success: true,
                    message: 'Report unliked successfully',
                    action: 'unliked'
                };
            } else {
                // Like: add user to likedBy array and increment likes
                await this.reportsCollection.updateOne(
                    { _id: reportObjectId },
                    { 
                        $addToSet: { likedBy: finalUserId },
                        $inc: { likes: 1 }
                    }
                );
                
                return {
                    success: true,
                    message: 'Report liked successfully',
                    action: 'liked'
                };
            }
        } catch (error) {
            console.error('Like report error:', error);
            return {
                success: false,
                error: `Failed to like report: ${error.message}`
            };
        }
    }

    async updateEmergencyContactStatus(email, contactEmail, status) {
        try {
            const result = await this.usersCollection.updateOne(
                { 
                    email: email.toLowerCase(),
                    'emergencyContacts.email': contactEmail.toLowerCase()
                },
                {
                    $set: {
                        'emergencyContacts.$.status': status,
                        'emergencyContacts.$.statusUpdatedAt': new Date()
                    }
                }
            );

            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: 'Contact not found or user not found'
                };
            }

            // Get updated user data
            const updatedUser = await this.usersCollection.findOne({ email: email.toLowerCase() });

            return {
                success: true,
                message: `Emergency contact status updated to ${status}`,
                user: {
                    _id: updatedUser._id,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    emergencyContacts: updatedUser.emergencyContacts
                }
            };
        } catch (error) {
            console.error('Update emergency contact status error:', error);
            return {
                success: false,
                error: 'Failed to update emergency contact status'
            };
        }
    }

    async getIncomingEmergencyRequests(approverEmail) {
        try {
            const cursor = this.usersCollection.find({
                'emergencyContacts.email': approverEmail.toLowerCase(),
                'emergencyContacts.status': 'pending'
            }, {
                projection: { email: 1, username: 1, profile: 1, emergencyContacts: 1 }
            });

            const requesters = await cursor.toArray();

            const incoming = [];
            for (const requester of requesters) {
                const contact = (requester.emergencyContacts || []).find(c => c.email && c.email.toLowerCase() === approverEmail.toLowerCase());
                if (contact && contact.status === 'pending') {
                    incoming.push({
                        requesterEmail: requester.email,
                        requesterUsername: requester.username,
                        requesterDisplayName: requester.profile?.displayName || requester.username,
                        requestedAt: contact.addedAt,
                    });
                }
            }

            return {
                success: true,
                requests: incoming
            };
        } catch (error) {
            console.error('Get incoming emergency requests error:', error);
            return {
                success: false,
                error: 'Failed to get incoming emergency requests'
            };
        }
    }

    async respondToEmergencyRequest(approverEmail, requesterEmail, action) {
        try {
            const status = action === 'approved' ? 'approved' : 'rejected';

            const result = await this.usersCollection.updateOne(
                {
                    email: requesterEmail.toLowerCase(),
                    'emergencyContacts.email': approverEmail.toLowerCase()
                },
                {
                    $set: {
                        'emergencyContacts.$.status': status,
                        'emergencyContacts.$.statusUpdatedAt': new Date(),
                        'emergencyContacts.$.respondedBy': approverEmail.toLowerCase()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return {
                    success: false,
                    error: 'Request not found'
                };
            }

            return {
                success: true,
                message: `Request ${status}`
            };
        } catch (error) {
            console.error('Respond to emergency request error:', error);
            return {
                success: false,
                error: 'Failed to respond to request'
            };
        }
    }
}

module.exports = AuthService;
