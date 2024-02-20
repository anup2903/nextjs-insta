
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  },
});
app.use(cors());
app.use(express.json());

// Multer configuration for handling image uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    cb(null, 'image-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Serve your static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
let posts = [];

// Socket.IO connection event
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('new-post', (newPost) => {
    posts.push(newPost);
    io.emit('updated-posts', posts);
  });

  // Listen for like-post event from the client
  socket.on('like-post', (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.likes++;
      io.emit('updated-posts', posts);
    }
  });

  socket.on('comment-post', ({ postId, comment }) => {
    // Find the post by postId in the posts array
    const post = posts.find((p) => p.id === postId);

    // Add the comment to the post
    if (post) {
      post.comments.push(comment);
      io.emit('updated-posts', posts);
    }
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Endpoint to get the current posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

app.post('/posts', upload.single('image'), (req, res) => {
    try {
      const { description } = req.body;
  
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload an image.' });
      }
  
      const imageUrl = req.file.filename;
      console.log('Image URL:', imageUrl);
  
      const newPost = { id: Date.now(), description, imageUrl, likes: 0, comments: [] };
  
      posts.push(newPost);
      // Emit an event to inform connected clients about the new post
      io.emit('new-post', newPost);
      // Broadcast the updated posts array to all connected clients
      io.emit('updated-posts', posts);
  
      
  
      res.status(201).json(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
