const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// const db = require('./database/dbConfig.js');
const Users = require('./users/users-model.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
 res.send("It's alive!");
});

server.post('/api/register', (req, res) => {
 let user = req.body;

 // hash the password
 // 8 is number of rounds (add time)
 const hash = bcrypt.hashSync(user.password, 8);
 user.password = hash;

 Users.add(user)
  .then(saved => {
   res.status(201).json(saved);
  })
  .catch(error => {
   res.status(500).json(error);
  });
});

server.post('/api/login', (req, res) => {
 let { username, password } = req.body;
 Users.findBy({ username })
  .first()
  .then(user => {
   if (user && bcrypt.compareSync(password, user.password)) {
    res.status(200).json({ message: `Welcome ${user.username}!` });
   } else {
    res.status(401).json({ message: 'Invalid Credentials' });
   }
  })
  .catch(error => {
   res.status(500).json(error);
  });
});

// restrict access to this endpoint to only users that provide
// the right credentials in the headers. use local middleware - 'restricted'
// server.get('/api/users', restricted, (req, res) => {
//  //  console.log(req.headers);
//  Users.find()
//   .then(users => {
//    res.json(users);
//   })
//   .catch(err => res.send(err));
// });
// grant access to only particular user
// server.get('/api/users', restricted, only(['sales', 'admin', 'marketing']), (req, res) => {
server.get('/api/users', restricted, only('frodo'), (req, res) => {
 Users.find()
  .then(users => {
   res.json(users);
  })
  .catch(err => res.send(err));
});

function restricted(req, res, next) {
 const { username, password } = req.headers;
 //  console.log('{username, password}', { username, password });
 //  console.log('username, password', username, password);
 if (username && password) {
  Users.findBy({ username })
   .first()
   .then(user => {
    if (user && bcrypt.compareSync(password, user.password)) {
     next();
    } else {
     res
      .status(401)
      .json({ message: 'You shall not pass! Invalid Credentials' });
    }
   })
   .catch(error => {
    res.status(500).json(error);
   });
 } else {
  res.status(401).json({ message: 'Please provide credentials' });
 }
}

function only(username) {
 return function(req, res, next) {
  //  if(username)
  //   console.log(username);
  if (req.headers.username === username) {
   next();
  } else {
   res.status(403).json({ message: `You are not ${username}` });
  }
 };
}

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
