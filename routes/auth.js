const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { User } = require('../models/User');

router.post('/', (req, res) => {
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
          return res.cookie("_auth", user.token)
                    .status(200)
                    .json({
                      id: user.id,
                      links: {
                        user: api.url + 'users/' + user.id
                      }
                    });
        })
      })
    })
});

module.exports = router;
