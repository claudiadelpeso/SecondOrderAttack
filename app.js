const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const db = require("./db");
const path = require("path");
const { query } = require("express");

const app = express(); // Make sure to initialize the app before using it
const port = 3000;

// Import the crypto module
const crypto = require('crypto');

// Add this function to generate Gravatar URL
function generateGravatarUrl(email) {
  const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://gravatar.com/avatar/${emailHash}?s=400&d=robohash&r=x`;
  //https://gravatar.com/avatar/c8346399ff86b9ce9914e2c42a22c4e1?s=400&d=robohash&r=x
    //return `https://avatars.dicebear.com/v2/avataaars/${emailHash}?s=100&d=identicon``;


}

function escapeSingleQuotes(str) {
  return str.replace(/'/g, "''");
}

app.use(bodyParser.urlencoded({ extended: false }));


app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
const current_loggedin=0;

app.post("/update-password", (req, res) => {
  const username = req.session.user.username;
  //const newPassword = req.body.new_password;
  const newPassword = escapeSingleQuotes(req.body.new_password);


  //const query = `UPDATE users SET password='${newPassword}' WHERE username='Admin' --'`;
  const quer2 = `UPDATE users SET password='${newPassword}' WHERE username='${username}'`;  



  db.exec(quer2, (err) => {
    if (err) {
      res.status(500).send("Error updating password");
    } else {
      res.redirect("/dashboard");
    }
  });
});

/*

app.post("/update-password", (req, res) => {
    const username = req.session.user.username;
    const newPassword = req.body.new_password;
    console.log(username);
  
    const stmt = db.prepare(`UPDATE users SET password=? WHERE username='${username}'`);
    console.log(stmt)
    stmt.run(newPassword, (err) => {
      if (err) {
        res.status(500).send("Error updating password");
      } else {
        res.redirect("/dashboard");
      }
    });
    stmt.finalize();
  });

  */
  
  

app.get("/users", (req, res) => {
    const query = "SELECT * FROM users";
  
    db.all(query, (err, rows) => {
      if (err) {
        res.status(500).send("Error retrieving users");
      } else {
        res.send(rows);
      }
    });
  });

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password =req.body.password;
    
   

    const checkUsernameQuery = 'SELECT username FROM users WHERE username = ?';
    db.get(checkUsernameQuery, [username], (err, row) => {
      if (err) {
        res.status(500).send("Error checking username");
      } else {
        // If the username is not found, row will be undefined
        if (row) {
          res.status(400).send("Username already exists");
        } else {
          // Insert the new user into the users table
              const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
              stmt.run(username, password)
              stmt.finalize();
              res.redirect("/");
            }
          }
    });
    /*
    const username = req.body.username;
    const password = req.body.password;

    const query = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;
    console.log(query)
    //const query1 = `INSERT INTO users (username) VALUES ('${username}')`;
    //const query2 = `INSERT INTO users (password) VALUES ('${password}')`;
    db.run(query, (err) => {
      if (err) {
        res.status(500).send("Error registering user");
      } else {
        res.redirect("/");
      }
    });
    */

    
    
  });


app.use(session({ secret: "your_secret_key", resave: false, saveUninitialized: false }));

// Add this line to serve static files
app.use(express.static(path.join(__dirname, "public")));


function getUserIdByUsername(username, callback) {
  db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      callback(err, null);
    } else if (row) {
      callback(null, row.id);
    } else {
      callback(new Error("User not found"), null);
    }
  });
}


app.post("/submit-blog-post", (req, res) => {
  if (!req.session.user) {
    res.status(401).send("You need to log in to access this page");
    return;
  }

  //const user_id = req.session.user.id;
  const username = req.session.user.username;

  const title = req.body.title;
  const content = req.body.content;

  getUserIdByUsername(username, (err, userId) => {
    if (err) {
      res.status(500).send("Error retrieving user ID");
      return;
    }  
  
  //console.log(getUserIdByUsername)

  
  const user_id=userId;
  const stmt = db.prepare("INSERT INTO blog_posts (user_id, title, content) VALUES (?, ?, ?)");
  stmt.run(user_id, title, content, (err) => {
    if (err) {
      res.status(500).send("Error submitting blog post");
    } else {
      res.redirect("/dashboard");
    }
  });
  stmt.finalize();
});
});


// Step 3: Create a login route
app.post("/login", (req, res) => {
    /*
    ' or true--
") or true--
') or true--
    */
    const username = req.body.username;
    const password = req.body.password;

    const quer2 = `SELECT * FROM users WHERE username ='${username}' AND password='${password}'`;
     
    //db.run(quer2, (err) => {
    //db.get(`SELECT * FROM users WHERE username ='${username}' AND password='${password}'`, (err, row) => {
  
  
      
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    //db.get(`SELECT * FROM users WHERE username ='${username}' AND password='${password}'`, (err, row) => {

      if (err) {
        res.status(500).send("Error checking credentials");
      } else if (row) {
        //req.session.user = { id: row.id, username: row.username };
        req.session.user = { username: row.username };

        res.redirect("/dashboard");
      } else {
     
        res.status(401).send("Invalid username or password");
      }
    });
  });
  

// Step 4: Create a dashboard route


app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    res.status(401).send("You need to log in to access this page");
    return;
  }


  
 

  db.all("SELECT blog_posts.id, blog_posts.title, blog_posts.content, blog_posts.number_likes, users.username, COUNT(blog_post_likes.id) AS likes FROM blog_posts LEFT JOIN users ON blog_posts.user_id = users.id LEFT JOIN blog_post_likes ON blog_posts.id = blog_post_likes.post_id GROUP BY blog_posts.id ORDER BY blog_posts.number_likes DESC", [], (err, blogPosts) => {
    
   
    if (err) {
      res.status(500).send("Error retrieving blog posts");
    } else {
     
      const blogPostsHtml = blogPosts.map(post => {
        const deleteButton = req.session.user.username === "Admin"
          ? `<form action="/delete-blog-post" method="post" style="display: inline;">
               <input type="hidden" name="post_id" value="${post.id}">
               <button type="submit" style="background: none; border: none; color: #f44336; cursor: pointer;">Delete</button>
             </form>`
          : "";
      
        return  `
      <style>
      body {
        font-family: 'Roboto', sans-serif;
        background-color: #f5f5f5;
        line-height: 1.6;
        color: #333;
      }
      
      .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .blog-post {
        background-color: #ffffff;
        padding: 25px;
        margin-bottom: 20px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      }
      
      .post-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      
      .post-details h3 {
        margin: 0;
        font-size: 24px;
      }
      
      .post-details small {
        font-size: 14px;
        color: #888;
      }
      
      .like-wrapper {
        display: flex;
        align-items: center;
      }
      
      .like-form {
        margin-right: 8px;
      }
      
      .heart-btn {
        background: none;
        border: none;
        color: #e44a46;
        font-size: 20px;
        cursor: pointer;
      }
      
      .heart-btn:focus {
        outline: none;
      }
      
      .heart-counter {
        font-size: 16px;
        color: #888;
      }
      

      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">

      <div class="blog-post">
      <div class="post-details">
      <h3>${post.title} <small>by ${post.username}</small>
        <img src="${generateGravatarUrl(post.username)}" alt="Profile picture" width="35" height="35">
      </h3>
      <div class="like-wrapper">
        <form action="/like-blog-post" method="post" class="like-form">
          <input type="hidden" name="post_id" value="${post.id}">
          <button class="heart-btn" type="submit">
            <i class="fas fa-heart"></i>
          </button>
        </form>
        <span>${post.number_likes} <span class="heart-counter">Likes</span></span>
        ${deleteButton}
      </div>
    </div>
    <p>${post.content}</p>
  </div>
    `}).join("");
    db.all("SELECT * FROM comments WHERE user_id = ?", [req.session.user.id], (err, rows) => {
      
     
        res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .container {
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      max-width: 500px;
      width: 100%;
    }

    
    
    
    h1, h2 {
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    label {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-weight: 500;
    }
    
    input[type="text"], textarea, input[type="password"] {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
    }
    input[type="submit"] {
      cursor: pointer;
      background-color: #68aaec;
      color: #fff;
      padding: 0.5rem;
      border-radius: 4px;
      border: none;
      font-size: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    }
    
    input[type="submit"]:hover {
      background-color: #007BFF;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
    }
    
    
    a {
      color: #007BFF;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    a:hover {
      color: #0056B3;
    }
    a.logout {
      color: #f44336;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    }
    
    a.logout:hover {
      color: #d32f2f;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
    }
    
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }
    }
    
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

  </head>
  <body>
  <div class="container">
  <div class="welcome-container">
  <h1>Welcome ${req.session.user.username}
  <img src="${generateGravatarUrl(req.session.user.username)}" alt="Profile picture" width="50" height="50">
  </h1>
</div>

  <h2>Blog Posts</h2>
  ${blogPostsHtml}
 

  <h2>Create a Blog Post</h2>
<form action="/submit-blog-post" method="post">
  <label for="title">Title:</label>
  <input type="text" id="title" name="title" required>
  <label for="content">Content:</label>
  <textarea id="content" name="content" rows="5" required></textarea>
  <input type="submit" value="Create Blog Post">
</form>
  <h2>Update Password</h2>
  <form action="/update-password" method="post">
    <label for="new_password">New Password:</label>
    <input type="password" id="new_password" name="new_password" required>
    <input type="submit" value="Update Password">
  </form>
  <br>
  <a href="/logout" class="logout">Logout</a>

    </div>
  </body>
  </html>
  `);

});
}
});
});
  
  

// Step 5: Create a logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send("Error logging out");
      } else {
        res.redirect("/");
      }
    });
  });

  app.get("/create-blog-post", (req, res) => {
    if (!req.session.user) {
      res.status(401).send("You need to log in to access this page");
      return;
    }
  
    res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Blog Post</title>
    <style>
      /* Add your CSS styles here */
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Create a New Blog Post</h1>
      <form action="/submit-blog-post" method="post">
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required>
        <label for="content">Content:</label>
        <textarea id="content" name="content" rows="10" cols="50" required></textarea>
        <input type="submit" value="Create Blog Post">
      </form>
      <a href="/dashboard">Back to dashboard</a>
    </div>
  </body>
  </html>
  `);
  });


  app.post("/create-blog-post", (req, res) => {
    if (!req.session.user) {
      res.status(401).send("You need to log in to access this page");
      return;
    }
  
    const { title, content } = req.body;
  
    db.run("INSERT INTO blog_posts (title, content, user_id) VALUES (?, ?, ?)", [title, content, req.session.user.id], function(err) {
      if (err) {
        res.status(500).send("Error creating the blog post");
      } else {
        res.redirect("/dashboard");
      }
    });
  });









  app.post("/like-blog-post", (req, res) => {
    const postId = req.body.post_id;
    const username = req.session.user.username;
  
    getUserIdByUsername(username, (err, userId) => {
      if (err) {
        res.status(500).send("Error retrieving user ID");
        return;
      }
      db.get("SELECT * FROM blog_post_likes WHERE user_id = '${userId}' AND post_id = '${postId}'", (err, row) => {
        if (err) {
          console.error("Error in blog_post_likes query:", err);
          //res.status(400).json({ error: "An error occurred while processing your request." });
          return;
        }
  
        if (row) {
          //res.status(400).json({ error: "You have already liked this post." });
          return;
        }
        db.run("INSERT INTO blog_post_likes (user_id, post_id) VALUES (?, ?)", [userId, postId], function (err) {
          if (err) {
            console.error("Error in blog_post_likes insertion:", err);
            //res.status(400).json({ error: "An error occurred while processing your request." });
            return;
          }
  
          db.run("UPDATE blog_posts SET likes = likes + 1 WHERE id = ?", postId, (err) => {
            if (err) {
              console.error("Error in blog_posts update:", err);
              //res.status(400).json({ error: "An error occurred while processing your request." });
              return;
            }

            const sql = `UPDATE blog_posts SET number_likes = number_likes + 1 WHERE id = ${postId}`;

            db.run(sql, function(err) {
              if (err) {
                  throw err;
              }
              console.log(`Likes updated for ${this.changes} row`);
            });
  
            res.redirect("/dashboard");
          });
        });
      });
    });
  });

  app.post("/delete-blog-post", (req, res) => {
    if (!req.session.user || req.session.user.username !== "Admin") {
      res.status(401).send("You need admin privileges to delete blog posts");
      return;
    }
  
    const postId = req.body.post_id;
    console.log(postId)
    const query = `DELETE FROM blog_posts WHERE id = ?`;
  
    db.run(query, postId, (err) => {
      if (err) {
        res.status(500).send("Error deleting blog post");
      } else {
        res.redirect("/dashboard");
      }
    });
  });
  
  
  
  
  
  
  
  
  
  

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
