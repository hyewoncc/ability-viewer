const express = require('express');
const router = express.Router();

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
        return res.status(200).json({});
      })
    })
});

module.exports = router;
