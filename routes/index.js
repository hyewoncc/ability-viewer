const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { User } = require('../models/User');

router.get('/', function(req, res, next) {
  res.json({
    message: "hello ability"
  })
});

router.post('/login', (req, res) => {
  User.findOne({ id: req.body.id }, (err, user) => {
    if(!user) {
      return res.status(401).json({
        loginSuccess: false,
        message: "Unregistred id or invalid password"
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch) {
        return res.status(401).json({
          loginSuccess: false,
          message: "Unregistred id or invalid password"
        });
      }

      user.generateToken((err, user) => {
        if(err) {
          return res.status(500).json({
            loginSuccess: false,
            message: "Server method failed"
          });
        }
        return res.status(200)
                  .json({
                    token: user.token,
                    id: user.id,
                    links: {
                      user: api.url + 'users'
                    }
                  });
      })
    })
  })
});

router.post('/logout', auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id},{ token: "" }, (err, user) => {
    if(err) {
      return res.status(500).json({
        logoutSuccess: false,
        message: "Server method failed"
      })
    }
    res.clearCookie('ability_auth');
    return res.status(200).json({
      logoutSuccess: true
    })
  })
})

module.exports = router;
