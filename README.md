# Editorial Atelier Portfolio

Portfolio web app for artists and designers to showcase and organize personal projects.

## Run locally

This first version is a dependency-free static app. Open `index.html` in a modern browser or serve the repository with any static web server.

## Firebase simulation

A small Firebase-shaped adapter is loaded from `firebase-mock.js`:
- Anonymous demo sign-in with a persistent local demo user.
- A Firestore-like `projects` collection backed by browser local storage.
- Storage URL references for project cover images.

This is a local preview emulator, not a connection to a real Firebase project. It uses no Firebase credentials and does not sync across browsers or devices.

## Features

- Public-facing portfolio with an editorial project gallery, category filters, and search.
- Project detail dialog with category, year, description, and tags.
- Organize mode to add, edit, delete, reorder, feature, publish, or save projects as drafts.
- Local browser persistence through `localStorage`.
- Responsive layouts and keyboard-accessible controls.

## Data and limitations

Projects are stored in the current browser only. This prototype has no authentication, server-side storage, or image upload; add projects using an image URL. Changes do not sync between devices or browsers.