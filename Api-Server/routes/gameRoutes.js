const express = require('express');
const router = express.Router();
const Game = require('../models/Game');


router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, platform, genre } = req.query;
    const query = {};
    
    if (platform) query.platforms = { $in: platform.split(',') };
    if (genre) query.genre = { $in: genre.split(',') };
    
    const games = await Game.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    const count = await Game.countDocuments(query);
    
    res.json({
      games,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search games by title or description
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) return res.status(400).json({ message: 'Search term is required' });
    
    const games = await Game.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Filter games by platform
router.get('/platform/:platform', async (req, res) => {
  try {
    const games = await Game.find({ platforms: req.params.platform });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific game by ID
router.get('/:id', async (req, res) => {
  try {
    const fields = req.query.fields ? req.query.fields.split(',').join(' ') : '';
    const game = await Game.findById(req.params.id).select(fields);
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new game
router.post('/', async (req, res) => {
  try {
    const newGame = new Game(req.body);
    const savedGame = await newGame.save();
    res.status(201).json(savedGame);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a game
router.put('/:id', async (req, res) => {
  try {
    console.log('Update request for ID:', req.params.id);
    console.log('Update data:', req.body);
    
    const updatedGame = await Game.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true }
    );
    
    if (!updatedGame) {
      console.log('Game not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Game not found' });
    }
    
    console.log('Game updated successfully:', updatedGame);
    res.json(updatedGame);
  } catch (err) {
    console.error('Error updating game:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a game
router.delete('/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get game platforms
router.get('/:id/platforms', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('platforms -_id');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(game.platforms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get game genre
router.get('/:id/genre', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('genre -_id');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(game.genre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get game developer
router.get('/:id/developer', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('developer -_id');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json({ developer: game.developer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get game screenshots
router.get('/:id/screenshots', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('screenshots -_id');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(game.screenshots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get game system requirements
router.get('/:id/requirements', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).select('systemRequirements -_id');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.json(game.systemRequirements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a generic property access route
router.get('/:id/:property', async (req, res) => {
  try {
    const { id, property } = req.params;
    
    // List of allowed properties for security
    const allowedProperties = [
      'title', 'platforms', 'genre', 'developer', 'publisher', 
      'releaseDate', 'description', 'coverImage', 'screenshots',
      'systemRequirements', 'price', 'rating'
    ];
    
    if (!allowedProperties.includes(property)) {
      return res.status(400).json({ message: 'Invalid property requested' });
    }
    
    const projection = {};
    projection[property] = 1;
    projection._id = 0;
    
    const game = await Game.findById(id, projection);
    
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    // Return just the value of the requested property
    res.json(game[property]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;