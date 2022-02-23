const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { User } = require('../models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/', function(req, res, next) {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if(err) {
      return res.json({ 
        success: false, err
      })
    }
    return res.status(201).json({
      success: true
    })
  })
});

module.exports = router;
