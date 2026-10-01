const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('Authorization');

  // 2. Check if no token is provided
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No security token provided.' });
  }

  try {
    // 3. Verify the token using our secret key (Split "Bearer <token>" if needed)
    const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    
    // 4. Attach the verified user details to the request object
    req.user = decoded;
    
    // 5. Move on to the actual API endpoint logic
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
};
