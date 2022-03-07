const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { User } = require('../models/User');

router.get('/', auth, function(req, res, next) {
    User.findById(req.user._id, function(err, user) {
        if(err) {
            return res.status(500).json({
                message: "Server method failed"
            })
        }

        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                links: {
                    books: api.url + 'books',
                    tags: api.url + 'tags'
                }
            }
        })
    })
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
