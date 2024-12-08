var express = require('express');
var router = express.Router();
var userSchema = require('../models/users');
var postSchema = require('../models/posts');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req,file,cb){
    cb(null,('uploads/blog_images/'));
  },
  filename: function(req,file,cb){
    cb(null,Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});


router.get('/',(req,res)=>{
  res.render('home');
})

router.get('/signup', (req, res) => {
  res.render('signup');
})

router.get('/signin', (req, res) => {
  res.render('signin');
})


function isAuth(req,res,next){
  const token = req.cookies.Auth_token;

  if(!token){
    console.log('Phele Login ker ! Aur us se bhi phele register ker 🤡');
    return res.status(403).send('Phele Login ker ! Aur us se bhi phele register ker 🤡');
  }

  jwt.verify(token,"vegeta",function(err,result){
    if(err){
      console.log('token verify error !');
      return res.status(403).send('you look suspicious 🤨 , tu hai kon re !');
    }
    req.user = result;
    next();
  })
}

router.get('/blogs',isAuth ,(req, res) => {
  res.render('blogs');
})


router.post('/signup', async (req, res) => {
  try {
    let { name, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userSchema.create({
      name,
      email,
      password: hash
    })
    console.log(user);
    res.redirect('/signin');
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).send("Error during signup");
  }
})

router.post('/signin',async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userSchema.findOne({ email });

    if (!user) {
      return res.status(404).redirect('/signup');
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      
      jwt.sign(
        { email: user.email, name: user.name ,_id:user._id},
        "vegeta", 
        { algorithm: 'HS256' },
        (err, token) => {
          if (err) {
            console.log(`Error signing token: ${err}`);
            return res.status(500).send('Internal server error');
          }

          res.cookie('Auth_token', token, {
            httpOnly: true,
            secure: false 
          });

          return res.redirect('/userhome'); 
        }
      );
    } else {
      res.status(401).send('Wrong Credentials!');
    }
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).send("Internal server error");
  }
})

router.post('/blogs', isAuth, upload.single('blog_image'), async(req, res) => {
  try {
    // Verify file was uploaded
    if (!req.file) {
      return res.status(400).send('Please upload an image');
    }

    // Create blog post
    const blog = await postSchema.create({
      title: req.body.title,
      content: req.body.content,
      userId: req.user._id,
      blogImage: req.file.filename
    });

    // Update user's posts
    await userSchema.findByIdAndUpdate(
      req.user._id,
      { $push: { postsId: blog._id } },
      { new: true }
    );

    res.redirect('/userhome');
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).send('Error creating blog post');
  }
});


router.get('/userhome', isAuth,async(req, res) => {  
  
  try {
    const userPosts = await postSchema.find({userId:req.user._id});

  res.render('userhome',{
    user:req.user ? req.user.name : null,
    posts:userPosts
  })
  } catch (error) {
    console.log(`Error fetching user posts: ${error}`);
    res.status(500).send(`Error loading User posts`);    
  }

})

router.get('/logout',(req,res)=>{
  res.clearCookie('Auth_token');
  res.redirect('/');
})


router.patch('/blogs/update/:id', isAuth, upload.single('blog_image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const updateFields = { title, content };

    if (req.file) {
      updateFields.blogImage = req.file.filename;
    }

    const blog = await postSchema.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!blog) {
      console.log('blog post not found');      
      return res.status(404).send('Blog post not found');
    }

    res.redirect('/userhome');
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).send('Error updating blog post');
  }
});

router.get('/blogs/edit/:id', isAuth, async (req, res) => {
  try {
    const post = await postSchema.findById(req.params.id);

    if (!post) {
      return res.status(404).send('Blog post not found');
    }

    res.render('edit', { post });
  } catch (error) {
    console.error('Error fetching post for editing:', error);
    res.status(500).send('Error fetching post');
  }
});


router.delete('/blogs/delete/:id', isAuth, async (req, res) => {
  try {
    const blog = await postSchema.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).send('Blog post not found');
    }

    // Remove the post ID from the user's posts array
    await userSchema.findByIdAndUpdate(
      req.user._id,
      { $pull: { postsId: blog._id } }  // Adjust to match the actual field name in userSchema
    );

    res.status(200).send('Blog post deleted successfully');
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).send('Error deleting blog post');
  }
});










module.exports = router;
