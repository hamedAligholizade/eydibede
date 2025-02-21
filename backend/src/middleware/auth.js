const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findByPk(decoded.id);
    
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authorized, invalid admin' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

const isFirstSetup = async (req, res, next) => {
  try {
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      req.isFirstSetup = true;
      next();
    } else {
      res.status(403).json({ error: 'Admin already exists' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { protect, isFirstSetup }; 