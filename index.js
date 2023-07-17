const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI)

//use bodyparse to parse POST request
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//user schema
const UserSchema = new Schema({
  username: String
})
const User = mongoose.model('User', UserSchema)

//exercise schema
const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model('Exercise', ExerciseSchema)

//post request to get the registered users
app.post('/api/users', async (req, res) => {
  const userObj = new User({
    username: req.body.username
  })
  try {
    const user = await userObj.save();
    return res.json(user)
  }
  catch (err) {
    console.error(err);
  }
});

// //get request for all users
app.get('/api/users', async (req, res) => {
  const findUsers = await User.find({});
  if (!findUsers) {
    res.send("No users available")
  } else {
    res.json(findUsers);
  }


})

// //post request for exercise information
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {

      res.send("User not exist");
      console.log(user)
    } else {

      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: !date ? new Date() : new Date(date)
      })
      const exercises = await exerciseObj.save();
      res.json({
        username: user.username,
        description: exercises.description,
        duration: exercises.duration,
        date: new Date(exercises.date).toDateString(),
        _id: user._id,
      });
    }
  }
  catch (err) {
    console.error(err);
  }
});

//get request to /api/users/:_id/logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const user = await User.findById(id);
  const { limit, from, to, } = req.query;
  const filter = { user_id: id };
  var dateObj = {};

  if (!user) {
    res.send("User does not exist")
    return;
  }

  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }

  if (from || to) {
    filter.date = dateObj;
  }

  const exercise = await Exercise.find(filter).limit(+limit ?? 300)
  const log = exercise.map(item => {
    return (
      {
        description: item.description,
        duration: item.duration,
        date: item.date.toDateString()
      }
    )
  }
  );

  res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
