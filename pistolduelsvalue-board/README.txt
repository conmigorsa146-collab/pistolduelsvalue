PistolDuelsValue - Netlify package (with shared Trade Board)

Contents:
  index.html                     the page
  netlify/functions/board.mjs    server function (stores logins, posts and wishlists)
  package.json                   dependency (@netlify/blobs, installed by Netlify)
  netlify.toml                   config

Deploy: upload these files to a GitHub repo connected to your Netlify site (Netlify installs the dependency itself).
Drag-and-drop of a folder will NOT install package.json dependencies, so use GitHub.
