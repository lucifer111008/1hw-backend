require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// 👉 Root check (so Render doesn't show 404 on base URL)
app.get('/', (req, res) => {
  res.send('1HW backend is running');
});

// 👉 LOGIN ROUTE
app.get('/login', (req, res) => {
  const discordURL = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(discordURL);
});

// 👉 CALLBACK ROUTE
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('No code provided');
  }

  try {
    // 🔁 Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const access_token = tokenResponse.data.access_token;

    // 👤 Get user info
    const userResponse = await axios.get(
      'https://discord.com/api/users/@me',
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const user = userResponse.data;

    // 🖼️ Safe avatar handling
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    // 🔥 FINAL REDIRECT (THIS FIXES YOUR 404 ISSUE)
    res.redirect(
      `https://1hw.netlify.app/?user=${encodeURIComponent(user.username)}&avatar=${encodeURIComponent(avatar)}`
    );

  } catch (error) {
    console.error('OAuth Error:', error.response?.data || error.message);
    res.send('Login failed');
  }
});

// 👉 Start server (Render uses dynamic port)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
