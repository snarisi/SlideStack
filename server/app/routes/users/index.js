const router = require('express').Router();
const mongoose = require('mongoose');
const UserModel = mongoose.model('Users');
const ClassModel = mongoose.model('Classes');
const PresentationModel = mongoose.model('Presentations');

router.param('id', function (req, res, next, id) {
    UserModel.findById(id)
        .then(user => {
            if (!user) {
                let err = new Error('User not found');
                err.status = 404;
                return next(err);
            }
            req.returnedUser = user;
            next();
        })
        .then(null, next);
});

// Get all users
router.get('/', (req, res, next) => {
  console.log("req.query:", req.query);
    if(req.query.name){
      req.query.name = new RegExp(req.query.name, "gi");
    }
    UserModel.find(req.query).populate('classes')
        .then(users => {
            res.send(users);
        })
        .then(null, next);

});

// Get a user by _id

router.get('/:id', (req, res, next) => {
    res.status(200).json(req.returnedUser);
});

// Create new user
router.post('/', (req, res, next) => {
    UserModel.create(req.body)
        .then(user => {
            req.logIn(user, function(loginErr) {
                if (loginErr) return next(loginErr);
                // We respond with a response object that has user with _id and email.
                res.status(200).send(
                    user.sanitize()
                );
            });
        })
        .then(null, next);
});


// Get all presentations a user owns
router.get('/:id/presentations', function (req, res, next) {
    console.log('user Id: ', req.params.id)
    PresentationModel.findPresentationsByOwner(req.params.id)
        .then(presentations => res.json(presentations))
        .then(null, next);
});

// Update a user
router.put('/:id', (req, res, next) => {

    Object.keys(req.body).forEach(key => {
        req.returnedUser[key] = req.body[key];
    });

    req.returnedUser.save()
        .then(user => res.status(200).json(user))
        .then(null, next);
});

// Delete a user
router.delete('/:id', (req, res, next) => {
    req.returnedUser.remove()
        .then(() => res.status(204).send());
});

module.exports = router;
