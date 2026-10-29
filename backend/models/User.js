const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a registered user in the AI Voice to Text system.
 * Passwords are never stored in plain text; only the bcrypt-generated passwordHash is saved.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
      'Please enter a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for fast lookups and unique email constraint
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);

