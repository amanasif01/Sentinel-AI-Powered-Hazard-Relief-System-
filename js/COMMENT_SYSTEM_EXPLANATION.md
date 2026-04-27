# Comment System Explanation

## How Comments Are Being Saved

The comment system in the community reports works as follows:

### 1. **Database Structure**
- **Comments Collection**: `comments` collection in MongoDB
- **Reports Collection**: `reports` collection with a `comments` count field

### 2. **Comment Data Structure**
```javascript
{
  _id: ObjectId,           // Unique comment ID
  reportId: ObjectId,      // ID of the report being commented on
  userId: ObjectId/String, // ID of the user making the comment
  text: String,            // The actual comment text
  createdAt: Date          // When the comment was created
}
```

### 3. **Comment Creation Process**

#### Frontend (React):
1. User types comment in textarea
2. Clicks "Post" button
3. `handleAddComment()` function is called
4. Makes POST request to `/api/community/reports/:reportId/comments`

#### Backend (Node.js):
1. Server receives POST request at `/api/community/reports/:reportId/comments`
2. Calls `authService.addComment(reportId, userId, commentText)`
3. Creates new comment document in `comments` collection
4. Updates the report's comment count: `comments: comments + 1`
5. Returns success response

### 4. **Comment Retrieval Process**

#### Frontend:
1. User clicks "Show Comments" button
2. `fetchComments()` function is called
3. Makes GET request to `/api/community/reports/:reportId/comments`

#### Backend:
1. Server receives GET request
2. Calls `authService.getReportComments(reportId)`
3. Finds all comments for that report
4. Populates user information for each comment
5. Returns comments with user details

### 5. **User Information Population**
- For each comment, the system looks up the user who made it
- Demo users get a mock user object: `{ username: 'Demo User', profile: { displayName: 'Demo User' } }`
- Real users get their actual username and profile information from the `user_accounts` collection

### 6. **Real-time Updates**
- After adding a comment, the system:
  - Refreshes the comments list for that report
  - Updates the comment count on the report card
  - Shows the new comment immediately

### 7. **API Endpoints**

#### Create Comment:
```
POST /api/community/reports/:reportId/comments
Body: { userId: string, commentText: string }
```

#### Get Comments:
```
GET /api/community/reports/:reportId/comments
Response: { success: boolean, comments: array }
```

### 8. **Error Handling**
- Invalid report ID
- Missing user ID or comment text
- Database connection issues
- User not found for comment population

### 9. **Security Considerations**
- Comments are tied to user IDs
- No authentication required (for demo purposes)
- Comments are stored permanently until manually deleted

### 10. **Performance Features**
- Comments are loaded on-demand (when user clicks "Show Comments")
- User information is cached during comment population
- Efficient database queries with proper indexing
