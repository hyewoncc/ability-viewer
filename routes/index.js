const express = require('express');
const app = express();
const router = express.Router();
const port = 5000;
const bodyParser = require('body-parser');

const config = require('../config/mongodb');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
const { User } = require('../models/User');
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('mongodb connected'))
  .catch(err => console.log(err));

router.get('/', function(req, res, next) {
  res.json({
    message: "hello ability"
  })
});

router.post('/users', function(req, res, next) {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if(err) {
      return res.json({ 
        success: false, err
      })
    }
    return res.status(201).json({

    })
  })
})

app.use('/', router);

app.listen(port, () => {
  console.log(`ability-backend is listening on port ${port}`);
});

module.exports = router;
