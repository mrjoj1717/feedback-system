// lib/auth.js
import jwt from 'jsonwebtoken';

export function authenticateToken(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'غير مصرح' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Token غير صالح' });
    }
  };
}
