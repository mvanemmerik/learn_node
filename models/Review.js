const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author id.'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: 'You must supply a store id.'
  },
  text: {
    type: String,
    required: 'Your review can not be blank.'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
});

module.exports = mongoose.model('Review', reviewSchema);

