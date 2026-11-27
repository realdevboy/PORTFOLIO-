# Editorial Atelier Portfolio

Portfolio web app for artists and designers to present and organize individual creative projects.

## Run locally

This first version is a dependency-free static app. Serve the repository with a local web server and open `index.html`.

## Features

- Public-facing portfolio with an editorial gallery, category filters, search, and project detail view.
- Local sign-up, sign-in, and sign-out flows with an individual profile per account.
- Profile editor for name, specialties, biography, and public contact e-mail.
- Visual project composer with live desktop and mobile previews.
- Image upload or image URL, plus project title, category, year, description, and tags.
- Publish, save draft, edit, delete, feature, and reorder projects.
- Responsive layouts and keyboard-accessible controls.

## Local Firebase simulation

`firebase-mock.js` provides a Firebase-shaped local adapter:
- Mock Auth for sign-up, sign-in, sign-out, and persisted demo sessions.
- User-scoped Firestore-like collections for projects and profiles.
- Storage-like image handling, including local image compression and preview URLs.

This is a local emulator for preview only, not a connection to a real Firebase project. It uses no real Firebase credentials or services. Accounts, profile data, and projects are stored in this browser and do not sync across devices. Do not use a real password in the demo.

Use **Experimentar o perfil de demonstração** in the login window to sign in with the preloaded example portfolio.