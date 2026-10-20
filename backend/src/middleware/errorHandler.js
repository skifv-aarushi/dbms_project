function errorHandler(err, req, res, next) {
  console.error('[Unhandled API Error]', err);

  const message = err.message || 'Internal Server Error';

  // Handle trigger exception: single active mentorship
  if (message.includes('Constraint Violation: Mentee') || message.includes('already has an active mentorship pairing')) {
    return res.status(409).json({
      error: 'This student already has an active mentor assigned.',
      details: message,
    });
  }

  // Handle unique constraint violation
  if (err.code === '23505' || message.includes('duplicate key value')) {
    return res.status(409).json({
      error: 'An account with this email address already exists.',
      details: message,
    });
  }

  // Handle check constraint violation
  if (err.code === '23514' || message.includes('check constraint')) {
    return res.status(400).json({
      error: 'Please check your inputs (e.g., CGPA 0-10, Rating 1-5, Attendance 0-100%).',
      details: message,
    });
  }

  // Handle Foreign Key violation
  if (err.code === '23503' || message.includes('foreign key constraint')) {
    return res.status(400).json({
      error: 'The selected user or record could not be found.',
      details: message,
    });
  }

  res.status(err.status || 500).json({
    error: message,
  });
}

module.exports = errorHandler;
