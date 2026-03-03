const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Supabase errors
  if (err.code) {
    const supabaseErrors = {
      'PGRST116': { status: 404, message: 'Resource not found' },
      '23505': { status: 409, message: 'Resource already exists' },
      '23503': { status: 400, message: 'Foreign key constraint violation' },
      'P0001': { status: 400, message: err.message || 'Database error' }
    };

    const error = supabaseErrors[err.code] || { status: 500, message: 'Database error' };
    return res.status(error.status).json({ error: error.message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;