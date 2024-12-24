const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const path = require('path');
const post = require('./models/post');
const crypto = require('crypto');
const fs = require('fs');
const upload = require("./config/multerconfig");



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure views folder is set correctly
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public'))); // Ensure public folder is set correctly



app.get('/profile', isLoggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate({
        path: 'posts',  // Populate posts field
        populate: {
            path: 'user',  // Populate the user in each post
            select: 'username'  // Only select the username field from the user
        }
    });

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Render the profile page and pass the user data
    res.render('profile', { user });
});


app.get('/like/:id', isLoggedin, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');

    if(post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect('/profile');
});

app.get("/edit/:id", isLoggedin, async (req, res) => {
    let post = await postModel.findById(req.params.id);
    let user = await userModel.findById(req.user.userid);

    if (!post) {
        return res.status(404).send('Post not found');
    }

    // Pass both user and post to the edit page
    res.render('edit', { post, user });
});


app.post("/update/:id", isLoggedin, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect('/profile');

});


app.post('/post', isLoggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;
    
    // Create a post linked to the user
    let post = await postModel.create({
        user: user._id,  // Reference to the logged-in user
        content: content,
    });
    
    user.posts.push(post._id);  // Add the post ID to the user's posts array
    await user.save();
    
    res.redirect('/profile');  // Redirect to the user's profile
});



// Home Route
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/profile/upload', (req, res) => {
    res.render('profileupload');
  });


app.post('/upload', isLoggedin, upload.single("image"), async (req, res, next) => {
    let user = await userModel.findOne({ email: req.user.email })
    user.profilePic = req.file.filename;
    await user.save();
    res.redirect('/profile');
});

// Register Route
app.post('/register', async (req, res) => {
    let { email, password, name, age, username } = req.body;
    
    let user = await userModel.findOne({ email });
    if (user) {
        return res.status(500).send('User already registered');
    }

    bcrypt.genSalt(10, async (err, salt) => {
        if (err) {
            return res.status(500).send('Error generating salt');
        }
        bcrypt.hash(password, salt, async (err, hash) => {
            if (err) {
                return res.status(500).send('Error hashing password');
            }

            const newUser = new userModel({
                email,
                password: hash,
                name,
                age,
                username
            });

            // Save user to DB
            await newUser.save();

            // Create a JWT Token
            let token = jwt.sign({ email: email, userid: newUser._id }, "shhh");

            // Set the cookie
            res.cookie('token', token);
            res.send('User registered');
        });
    });
});


// Login Route (GET)
app.get('/login', (req, res) => {
    res.render('login');  // Ensure login.ejs exists in the 'views' folder
});

// Login Post Route
app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send('User not found');

    bcrypt.compare(password, user.password, function(err, result) {
        if (err) return res.status(500).send('Error comparing passwords');

        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhh");
            res.cookie('token', token);  // Set token in cookies
            console.log('Token set:', token);  // Debugging log
            return res.status(200).redirect('/profile');
        } else {
            return res.redirect('/login');
        }
    });
});


app.get("/logout", (req, res) => {
    res.clearCookie('token', { path: '/' }); // Make sure the path is the same as the one when setting the cookie
    res.redirect('/login');
});

// Middleware to check if the user is logged in
function isLoggedin(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect('/login?error=Please login first');
    }

    jwt.verify(req.cookies.token, "shhh", (err, decoded) => {
        if (err) {
            return res.status(500).send('Invalid token');
        }

        console.log('Decoded token:', decoded); // Debugging log
        req.user = decoded; // Assign decoded to req.user
        next();  // Proceed to the next middleware/route
    });
}




// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
