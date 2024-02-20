'use client'
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Home = () => {
  const [socket, setSocket] = useState(null);
  const [posts, setPosts] = useState([]);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [comment, setComment] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const socketConnection = io('http://localhost:3001');
    setSocket(socketConnection);


    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:3001/posts');
        if (response.ok) {
          const existingPosts = await response.json();
          setPosts(existingPosts);
        } else {
          console.error('Error fetching posts:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
  
    fetchPosts();
    // Listen for updated-posts event from the server
    socketConnection.on('updated-posts', (updatedPosts) => {
      setPosts(updatedPosts);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImage(selectedFile);
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handlePostSubmit = async () => {
    if (!description || !image) {
      alert('Please provide both description and image.');
      return;
    }
  
    const formData = new FormData();
    formData.append('description', description);
    formData.append('image', image);
  
    try {
      // First, post the image data to the server
      const imageResponse = await fetch('http://localhost:3001/posts', {
        method: 'POST',
        body: formData,
      });
  
      if (imageResponse.ok) {
        // Then, emit a socket event to inform connected clients about the new post
        socket.emit('new-post', { description, image: image.name });
      } else {
        console.error('Error posting image data to the server:', imageResponse.statusText);
      }
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      // Reset form fields
      setDescription('');
      setImage(null);
    }
  };
  

  const handleLike = (postId) => {
    // Emit a socket event to inform the server about the like
    socket.emit('like-post', postId);
  };

  const handleComment = (postId, comment) => {
    // Emit a socket event to inform the server about the comment
    socket.emit('comment-post', { postId, comment });
  };

  return (
    <div className='bg-[#272838] h-[100vh] text-white'>
      <h1 className="text-6xl font-serif flex justify-center py-3 ">POSTIFY</h1>
      <div className="flex relative main mt-10 justify-around">
        <div className="w-[45%] relative post bg-[#5D536B] rounded-xl">
          {" "}
          <div className="flex flex-col items-center ">
            <h1 className="my-3 text-4xl font-bold">Create your Post</h1>
            <textarea
              placeholder="Write your post description..."
              value={description}
              className="text-black w-[80%] p-2 rounded-xl"
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <input
              type="file"
              accept="image/*"
              className="mt-3 mx-auto"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="image-preview w-[65%] mt-3">
                <img src={imagePreview} alt="Preview" className='rounded-xl' />
              </div>
            )}
            <button
              onClick={handlePostSubmit}
              className="bg-blue-400 w-[4rem] rounded-xl my-5"
            >
              Post
            </button>
          </div>
        </div>
        <div className="w-[45%] flex flex-col items-center justify-center  p-2 live bg-[#5D536B] rounded-xl">
          {/* <div > */}
            <h1 className='text-4xl font-bold'>Live Post Feed</h1>
            <div className='overflow-y-auto ms-overflow-style-none scrollbar-none h-[70vh] p-3'>
              {posts.map((post) => (
                <div key={post.id} className='border-b-slate-50 my-3 flex flex-col items-center gap-2'>
                  {/* {console.log(post.imageUrl)} */}
                  <img
                    src={`http://localhost:3001/uploads/${post.imageUrl}`}
                    alt="Post"
                    // style={{ maxWidth: "100px", maxHeight: "100px" }}
                    className='w-[20rem] rounded-xl'
                  />
                  <p className='rounded-xl p-2 bg-[#989FCE]'>{post.description}</p>
                  <p>Likes: {post.likes}</p>
                  <button onClick={() => handleLike(post.id)} className='bg-blue-400 w-[3rem] rounded-xl'>Like</button>
                  <div className='flex flex-col'>
                    <input
                      type="text"
                      placeholder="Add a comment "
                      onChange={(e) => {
                        setComment(e.target.value);
                      }}
                      className='text-black rounded-xl p-1'
                    />
                    <button onClick={() => handleComment(post.id, comment)} className='bg-blue-400 rounded-xl p-1 mt-2  font-serif'>
                      Comment
                    </button>
                  </div>
                  <div>
                    {post.comments &&
                      post.comments.map((comment, index) => (
                        <p key={index} className='bg-[#989FCE] p-2 rounded-xl mb-1'>{comment}</p>
                      ))}
                  </div>
                  <hr className='w-[100%] bg-white mt-3 '/>
                </div>
              ))}
            </div>
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default Home;
