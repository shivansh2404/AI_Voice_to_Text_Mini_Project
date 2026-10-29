const mongoose = require('mongoose');

/**
 * Note Schema
 * Represents a saved voice-to-text note owned by a specific user.
 * Each note is strictly tied to a user via userId for data isolation.
 */
const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Indexed for quick retrieval of all notes belonging to a specific user
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  text: {
    type: String,
    required: [true, 'Note text content is required']
  },
  language: {
    type: String,
    enum: ['en-IN', 'hi-IN'],
    default: 'en-IN',
    required: [true, 'Language is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp whenever a document is saved/updated
noteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', noteSchema);

