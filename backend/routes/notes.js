const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Note = require('../models/Note');
const { requireAuth } = require('../middleware/auth');

// All notes endpoints require authentication
router.use(requireAuth);

/**
 * @route   POST /api/notes
 * @desc    Save a new voice-to-text note to MongoDB
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, text, language } = req.body;

    // 1. Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note title is required.'
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save an empty note. Please record or enter some text.'
      });
    }

    // 2. Validate language choice (only en-IN and hi-IN allowed)
    const validLanguages = ['en-IN', 'hi-IN'];
    const chosenLanguage = validLanguages.includes(language) ? language : 'en-IN';

    // 3. Create note record linked directly to logged-in user
    const newNote = new Note({
      userId: req.userId,
      title: title.trim(),
      text: text.trim(),
      language: chosenLanguage
    });

    const savedNote = await newNote.save();

    return res.status(201).json({
      success: true,
      message: 'Note saved successfully to MongoDB!',
      note: savedNote
    });
  } catch (error) {
    console.error('Error saving note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save note to MongoDB. Please try again.'
    });
  }
});

/**
 * @route   GET /api/notes
 * @desc    Fetch all notes belonging to the logged-in user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Only return notes that match this user's ID, sorted newest first
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notes from MongoDB.'
    });
  }
});

/**
 * @route   GET /api/notes/:id
 * @desc    Fetch a single note by ID (with strict ownership check)
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    // Enforce ownership: query must match both Note ID and User ID
    const note = await Note.findOne({ _id: id, userId: req.userId });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to access it.'
      });
    }

    return res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Error fetching single note:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving note.'
    });
  }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note's title, text, or language (with ownership verification)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, text, language } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    // Enforce ownership: find existing note belonging to this user
    const note = await Note.findOne({ _id: id, userId: req.userId });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to edit it.'
      });
    }

    // Update fields if provided
    if (title && title.trim()) {
      note.title = title.trim();
    }
    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Note text cannot be empty.'
        });
      }
      note.text = text.trim();
    }
    if (language) {
      const validLanguages = ['en-IN', 'hi-IN'];
      if (validLanguages.includes(language)) {
        note.language = language;
      }
    }

    note.updatedAt = Date.now();
    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully in MongoDB!',
      note: updatedNote
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update note in MongoDB.'
    });
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note from MongoDB (with ownership verification)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    // Enforce ownership: delete only if it belongs to req.userId
    const deletedNote = await Note.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deletedNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to delete it.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note deleted permanently from MongoDB.'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note from MongoDB.'
    });
  }
});

module.exports = router;

