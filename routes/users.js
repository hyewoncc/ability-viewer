const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { User } = require('../models/User');

/* GET users listing. */
router.get('/', auth, function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if(err) {
      return res.status(500).json({ 
        message: "Server method failed"
      })
    }
    return res.status(201).json({
      success: true
    })
  })
});

module.exports = router;
