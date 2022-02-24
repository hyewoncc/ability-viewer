const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { User } = require('../models/User');

router.get('/', auth, function(req, res) {
    
});
  
module.exports = router;
