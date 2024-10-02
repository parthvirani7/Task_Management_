const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  token = token.replace('Bearer ', '');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token verification failed' });
    req.user = decoded;
    next();
  });
};
