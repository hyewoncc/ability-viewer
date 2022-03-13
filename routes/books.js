const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Book } = require('../models/Book');
const { Tag } = require('../models/Tag');
const { User } = require('../models/User');

router.get('/', auth, function(req, res) {
    const userId = req.user._id;
    const tagId = req.query.tag;
    if (tagId) {
        Tag.findById(tagId, function(err, tag) {
            if(err) {
                return res.status(500).json({
                    message: "Server method failed"
                  })
            }
            const booksInTag = tag.books.toObject();
            booksInTag.forEach(book => {
                book.links = {
                    book: api.url + 'books/' + book._id,
                    delete: api.url + 'books/' + book._id
                };
                delete(book._id);
            });
            return res.status(200).json({
                books: booksInTag
            })
        })
    }else {
        User.findById(userId, function(err, user) {
            if(err) {
                return res.status(500).json({
                    message: "Server method failed"
                  })
            }
            const booksInUser = user.books.toObject();
            booksInUser.forEach(book => {
                book.links = {
                    book: api.url + 'books/' + book._id,
                    delete: api.url + 'books/' + book._id
                };
                delete(book._id);
            });
            return res.status(200).json({
                books: booksInUser
            })
        });
    }
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

router.patch('/:_id', auth, async(req, res) => {
    try {
        const targetBook = await Book.findById(req.params._id);
        const updateBook = req.body;

        const user = await User.findById(req.user._id);

        targetBook.name = updateBook.name;
        targetBook.text = updateBook.text;

        const updateTags = updateBook.tags;
        const preserveTags = [];
        const pullTagsId = [];

        for (const existTag of targetBook.tags) {
            let matchTag = updateTags.filter(tag => tag.name === existTag.name);
            if (matchTag.length === 0) {
                pullTagsId.push(existTag._id);
            }else {
                preserveTags.push(existTag);
            }
        }

        for (const preserveTag of preserveTags) {
            const updateTagResult = await Tag.findOneAndUpdate(
                { _id: preserveTag._id, "books._id": targetBook._id },
                { $set: { "books.$.name": targetBook.name }}
            );
        }

        const updateUserResult = await User.findOneAndUpdate(
            { _id: user._id, "books._id": targetBook._id },
            { $set: { "books.$.name": targetBook.name }}
        );

        const tagPulledBook = await Book.findByIdAndUpdate(
            { _id: targetBook._id }, 
            { $pull: { tags: { _id: { $in: pullTagsId}}}}
        );

        for (const updateTag of updateTags) {
            let isExist = false;
            for (const oldTag of targetBook.tags ) {
                if (updateTag.name === oldTag.name) {
                    isExist = true;
                }
            }

            if (!isExist) {
                const originTagExist = await Tag.exists({user_id: user._id, name: updateTag.name});
                if (!originTagExist) {
                    const tag = new Tag(updateTag);
                    tag.books.push(targetBook);
                    tag.user_id = user._id;

                    const newTag = await tag.save();
                    targetBook.tags.push(newTag);
                    user.tags.push(newTag);
                } else {
                    const originTag = await Tag.findOne({user_id: user._id, name: updateTag.name});
                    originTag.books.push(targetBook);
                    const updatedOriginTag = await originTag.save();
                    targetBook.tags.push(originTag);
                }
            }
        }

        for (const pullTagId of pullTagsId) {
            const tag = await Tag.findById(pullTagId);
            if (tag.books.length === 1) {
                const deleteResult = await tag.delete();
                const tagPulledUser = await User.findByIdAndUpdate(
                        { _id: user._id },
                        { $pull: { tags: { _id: tag._id }}}
                    );
            } else {
                const updatedTag = await Tag.findByIdAndUpdate(
                    { _id: pullTagId },
                    { $pull: { books: { _id: targetBook._id }}}
                )
            }
        }
        
        targetBook.save((err) => {
            if(err) {
                return res.status(500).json({
                    message: "Server method failed"
                })
            }
        })

        user.save((err) => {
            if(err) {
                return res.status(500).json({
                    message: "Server method failed"
                })
            }
        })
        
    }catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server method failed"
        })
    }
    
    return res.status(200).json({
        success: true
    })
})

router.delete('/:_id', auth, async(req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params._id);
        try {
            const targetuser = await User.findByIdAndUpdate({ _id: req.user._id },{ $pull: { books: { _id: deletedBook._id }}});
            for(const targetTag of deletedBook.tags) {
                try {
                    const tag = await Tag.findById(targetTag._id);
                    if (tag.books.length === 1) {
                        try {
                            const deletedTag = await tag.delete();
                            try {
                                const targetUserToPullTag = await User.findByIdAndUpdate(
                                    { _id: targetuser._id }, { $pull: { tags: { _id: deletedTag._id }}});
                            } catch(err) {
                                return res.status(500).json({
                                    message: "Server method failed"
                                })
                            }
                        } catch(err) {
                            return res.status(500).json({
                                message: "Server method failed"
                            })
                        }
                        tag.delete((err) => {
                            if(err) {
                                console.log(err);
                                return res.status(500).json({
                                    message: "Server method failed"
                                })
                            }
                        })
                    } else {
                        try {
                            const updatedTag = await Tag.findByIdAndUpdate(
                                { _id: targetTag._id },
                                { $pull: { books: { _id: deletedBook._id }}}
                            )
                        } catch (err) {
                            console.log(err);
                            return res.status(500).json({
                                message: "Server method failed"
                            })
                        }
                    }
                } catch (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Server method failed"
                    })
                }
            }
        } catch(err) {
            console.log(err);
            return res.status(500).json({
                message: "Server method failed"
            })
        }
        return res.status(201).json({
            success: true
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Server method failed"
        })
    }
});

module.exports = router;
