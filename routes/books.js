const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Book } = require('../models/Book');
const { Tag } = require('../models/Tag');
const { User } = require('../models/User');

router.get('/', auth, function(req, res) {
    const userId = req.query.id;
    User.findOne({ "id:": userId }, function(err, user) {
        const books = user.books.toObject();
        books.forEach(book => {
            book.links = {
                book: api.url + 'books/' + book._id,
                delete: api.url + 'books/' + book._id
            }
        });
        return res.status(200).json({
            books: books
        })
    });
})

router.get('/:_id', auth, function(req, res) {
    Book.findById(req.params._id, function(err, book) {
        if(err) {
            return res.status(500).json({
              message: "Server method failed"
            })
        }
        return res.status(200).json({
            name: book.name,
            text: book.text,
            tags: book.tags,
            links: {
                update: api.url + 'books/' + book._id,
                delete: api.url + 'books/' + book._id
            }
        })
    })
})

router.post('/', auth, async(req, res, next) => {
    const book = new Book(req.body.book);
    const tags = req.body.tags;
    try {
        const bookInfo = await book.save();
        try {
            const user = await User.findOne({ _id: req.user._id });
            user.books.push(book);
            let tagcount = 0;
            if(tags.length === 0) {
                user.save((err) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Server method failed"
                        })
                    }
                    return res.status(201).json({
                        success: true
                    })
                })
            }
            for(const tagInfo of tags) {
                try {
                    const userAlreadyHaveTag = await User.find({ _id: user._id, 'tags' : {'$elemMatch' : {'name': tagInfo.name}}});
                    if (!userAlreadyHaveTag.length) {
                        const tag = new Tag(tagInfo);
                        tag.books.push(book);
                        tag.user_id = user._id;
                        try {
                            const newTag = await tag.save();
                            book.tags.push(tag);
                            user.tags.push(tag);
                        }catch(err) {
                            return res.status(500).json({
                                message: "Server method failed"
                            })
                        }
                    }else{
                        try {
                            const existTag = await Tag.find({user_id: user._id, name: tagInfo.name});
                            existTag[0].books.push(book);
                            book.tags.push({
                                name: existTag[0].name,
                                _id: existTag[0]._id
                            });
                            try {
                                const saveExistTag = await existTag[0].save();
                            } catch(err) {
                                return res.status(500).json({
                                    message: "Server method failed"
                                })
                            }
                        } catch (err) {
                            return res.status(500).json({
                                message: "Server method failed"
                            })
                        }
                    }
                    tagcount += 1;
                    if(tagcount === tags.length) {
                        book.save((err) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Server method failed"
                                })
                            }
                            user.save((err) => {
                                if (err) {
                                    return res.status(500).json({
                                        message: "Server method failed"
                                    })
                                }
                                return res.status(201).json({
                                    success: true
                                })
                            })
                        })
                    } 
                } catch(err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Server method failed"
                    })
                }
            }
        }catch(err) {
            console.log(err);
            return res.status(500).json({
                message: "Server method failed"
            })
        }
    }catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server method failed"
        })
    }
})

router.delete('/:_id', auth, function(req, res){
    Book.findByIdAndDelete(req.params._id, function(err, book) {
        if(err) {
            return res.status(500).json({
              message: "Server method failed"
            })
        }
        User.findByIdAndUpdate(
            { _id: req.user._id },
            { $pull: { books: { _id: book._id }}},
            function(err, user) {
                if(err) {
                    return res.status(500).json({
                      message: "Server method failed"
                    })
                }
        })
        return res.status(200).json({
            success: true
        })
    })
});

module.exports = router;
