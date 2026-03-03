const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const { getSupabase } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    const { data: existingUser } = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: user, error } = await userModel.create({
      email,
      name: name || email.split('@')[0],
      role: 'user'
    });

    if (error) throw error;

    const token = generateToken(user.id);
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const { data: user, error } = await userModel.findByEmail(email);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    
    const { data: user, error } = await userModel.update(req.user.id, {
      name,
      avatar_url
    });
    
    if (error) throw error;
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };