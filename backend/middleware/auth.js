/**
 * Authentication Middleware
 * Verifies that the incoming request has a valid, active user session.
 * Rejects unauthenticated requests with a 401 Unauthorized HTTP status.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    // User is authenticated, attach user object/id to request for downstream handlers
    req.userId = req.session.userId;
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Please log in to access this resource.'
  });
}

module.exports = {
  requireAuth
};

