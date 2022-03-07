const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Tag } = require('../models/Tag');
const { Book } = require('../models/Book');
const { User } = require('../models/User');

router.get('/', auth, function(req, res) {
    User.findById(req.user._id, function(err, user) {
        if(err) {
            return res.status(500).json({
                message: "Server method failed"
            })
        }
        const userTags = user.tags;
        const responseTags = [];
        for (const tag of userTags) {
            const responseTag = {
                name: tag.name,
                links: {
                    books: api.url + 'books?tag=' + tag._id 
                }
            }
            responseTags.push(responseTag);
        }
        return res.status(200).json({
            tags: responseTags
        })
    })
})

module.exports = router;
