(function () {
  "use strict";

  const namespace = "atelier-firebase-emulator:";
  const authKey = namespace + "auth";
  const listeners = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  const auth = {
    currentUser: read(authKey),
    onAuthStateChanged: function (callback) {
      listeners.push(callback);
      callback(auth.currentUser);
      return function () {
        const index = listeners.indexOf(callback);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    signInAnonymously: function () {
      if (!auth.currentUser) {
        auth.currentUser = {
          uid: "atelier-demo-user",
          displayName: "Artista de demonstração",
          isAnonymous: true,
          providerId: "mock"
        };
        write(authKey, auth.currentUser);
      }
      listeners.forEach(function (callback) { callback(auth.currentUser); });
      return Promise.resolve({ user: auth.currentUser });
    },
    signOut: function () {
      auth.currentUser = null;
      try { localStorage.removeItem(authKey); } catch (error) {}
      listeners.forEach(function (callback) { callback(null); });
      return Promise.resolve();
    }
  };

  const firestore = {
    collection: function (name) {
      const key = namespace + "collection:" + name;
      return {
        get: function () {
          const documents = read(key);
          return Array.isArray(documents) ? clone(documents) : null;
        },
        setAll: function (documents) {
          return write(key, clone(documents));
        },
        clear: function () {
          try { localStorage.removeItem(key); return true; } catch (error) { return false; }
        }
      };
    }
  };

  const storage = {
    saveReference: function (projectId, url) {
      const key = namespace + "storage-references";
      const records = read(key) || {};
      records[projectId] = { url: url, updatedAt: new Date().toISOString(), mode: "url-reference" };
      write(key, records);
      return Promise.resolve({ ref: "mock-storage/" + projectId, downloadURL: url });
    },
    getReference: function (projectId) {
      const records = read(namespace + "storage-references") || {};
      return records[projectId] || null;
    }
  };

  window.firebaseMock = {
    mode: "local-emulator",
    app: { name: "editorial-atelier-demo", options: { projectId: "atelier-local-demo" } },
    auth: auth,
    firestore: firestore,
    storage: storage
  };
})();