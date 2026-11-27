(function () {
  "use strict";
  const namespace = "atelier-firebase-emulator:";
  const accountsKey = namespace + "auth:accounts";
  const sessionKey = namespace + "auth:session";
  const listeners = [];
  function read(key) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; } catch (error) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; } }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function makeId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }
  async function digest(password, salt) {
    const source = password + ":" + salt;
    if (window.crypto && crypto.subtle) {
      const bytes = new TextEncoder().encode(source);
      const result = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(result)).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    }
    return encodeURIComponent(source);
  }
  function publicUser(account) { return account ? { uid: account.uid, email: account.email, displayName: account.displayName, isAnonymous: false, providerId: "password" } : null; }
  const accounts = read(accountsKey) || {};
  const savedSession = read(sessionKey);
  const auth = {
    currentUser: savedSession && accounts[savedSession.email] ? publicUser(accounts[savedSession.email]) : null,
    onAuthStateChanged: function (callback) { listeners.push(callback); callback(auth.currentUser); return function () { const index = listeners.indexOf(callback); if (index >= 0) listeners.splice(index, 1); }; },
    createUserWithEmailAndPassword: async function (name, email, password) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (accounts[normalizedEmail]) throw new Error("Este e-mail já tem uma conta. Entre ou use outro endereço.");
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalizedEmail)) throw new Error("Digite um e-mail válido.");
      if (String(password).length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
      const uid = makeId();
      accounts[normalizedEmail] = { uid: uid, email: normalizedEmail, displayName: String(name).trim(), passwordDigest: await digest(password, uid) };
      write(accountsKey, accounts);
      const user = publicUser(accounts[normalizedEmail]);
      auth.currentUser = user;
      write(sessionKey, { email: normalizedEmail });
      firestore.collection("profiles", uid).set({ displayName: user.displayName || "Meu ateliê", specialty: "Artista independente\\nDesign & imagem", bio: "Um espaço para compartilhar ideias, processos e projetos autorais.", contactEmail: normalizedEmail });
      listeners.forEach(function (callback) { callback(user); });
      return { user: user };
    },
    signInWithEmailAndPassword: async function (email, password) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail === "demo@atelie.local" && password === "atelier-demo" && !accounts[normalizedEmail]) {
        const uid = "atelier-demo-user";
        accounts[normalizedEmail] = { uid: uid, email: normalizedEmail, displayName: "Ateliê Demo", passwordDigest: await digest(password, uid) };
        write(accountsKey, accounts);
        firestore.collection("profiles", uid).set({ displayName: "Ateliê Demo", specialty: "Direção de arte\\nDesign gráfico\\nImagem & matéria", bio: "Sou uma designer independente que trabalha entre identidade visual, imagem e objetos. Gosto de projetos que começam com uma boa pergunta e encontram sua forma no caminho.", contactEmail: normalizedEmail });
      }
      const account = accounts[normalizedEmail];
      if (!account || account.passwordDigest !== await digest(password, account.uid)) throw new Error("E-mail ou senha não conferem.");
      auth.currentUser = publicUser(account);
      write(sessionKey, { email: normalizedEmail });
      listeners.forEach(function (callback) { callback(auth.currentUser); });
      return { user: auth.currentUser };
    },
    signOut: async function () { auth.currentUser = null; try { localStorage.removeItem(sessionKey); } catch (error) {} listeners.forEach(function (callback) { callback(null); }); }
  };
  const firestore = {
    collection: function (name, ownerId) {
      const key = namespace + "collection:" + (ownerId || "public") + ":" + name;
      return { get: function () { const value = read(key); return value === null ? null : clone(value); }, set: function (value) { return write(key, clone(value)); }, setAll: function (documents) { return write(key, clone(documents)); }, clear: function () { try { localStorage.removeItem(key); return true; } catch (error) { return false; } } };
    }
  };
  const storage = {
    uploadImage: function (file, ownerId, projectId) {
      return new Promise(function (resolve, reject) {
        if (!file) return resolve(null);
        if (!/^image\\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Use uma imagem JPG, PNG ou WebP."));
        if (file.size > 2 * 1024 * 1024) return reject(new Error("A imagem deve ter no máximo 2 MB."));
        const reader = new FileReader();
        reader.onload = function () {
          const url = String(reader.result || "");
          const references = read(namespace + "storage:references") || {};
          references[ownerId + ":" + projectId] = { name: file.name, type: file.type, size: file.size, url: url, mode: "local-emulator" };
          if (!write(namespace + "storage:references", references)) return reject(new Error("O navegador não tem espaço para guardar esta imagem."));
          resolve(url);
        };
        reader.onerror = function () { reject(new Error("Não foi possível ler a imagem selecionada.")); };
        reader.readAsDataURL(file);
      });
    },
    saveReference: function (ownerId, projectId, url) { const references = read(namespace + "storage:references") || {}; references[ownerId + ":" + projectId] = { url: url, mode: "url-reference" }; write(namespace + "storage:references", references); return Promise.resolve({ downloadURL: url }); },
    getReference: function (ownerId, projectId) { const references = read(namespace + "storage:references") || {}; return references[ownerId + ":" + projectId] || null; }
  };
  window.firebaseMock = { mode: "local-emulator", app: { name: "editorial-atelier-demo", options: { projectId: "atelier-local-demo" } }, auth: auth, firestore: firestore, storage: storage };
})();