const LEGACY_STORAGE_KEY = "atelier-portfolio-projects-v1";
const firebaseBackend = window.firebaseMock;
const fallbackImage = "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=85";
const starterProjects = [
  { id: "p1", title: "Casa entre folhas", category: "Direção de arte", year: "2025", description: "Uma identidade visual para um refúgio cercado pela mata. O projeto explora a relação entre arquitetura, paisagem e hospitalidade.", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85", tags: ["hospitalidade", "natureza", "identidade"], featured: true, published: true, order: 0 },
  { id: "p2", title: "Caderno de marés", category: "Editorial", year: "2025", description: "Publicação independente sobre memória costeira, feita de relatos, mapas e pequenas observações à beira-mar.", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1200&q=85", tags: ["publicação", "pesquisa", "livro"], featured: false, published: true, order: 1 },
  { id: "p3", title: "Luz de agosto", category: "Fotografia", year: "2024", description: "Série fotográfica sobre a luz breve do fim do inverno e aquilo que ela revela nas coisas comuns.", image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85", tags: ["fotografia", "paisagem", "luz"], featured: false, published: true, order: 2 },
  { id: "p4", title: "Fruta inteira", category: "Identidade visual", year: "2024", description: "Sistema de marca para uma pequena mercearia de bairro, com cores francas, formas orgânicas e impressão em duas tintas.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85", tags: ["marca", "embalagem", "cor"], featured: true, published: true, order: 3 },
  { id: "p5", title: "Inventário do silêncio", category: "Ilustração", year: "2023", description: "Desenhos feitos durante uma residência no interior. Um exercício de atenção aos pequenos movimentos do cotidiano.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1400&q=85", tags: ["desenho", "residência", "processo"], featured: false, published: true, order: 4 },
  { id: "p6", title: "Forma de água", category: "Objeto", year: "2023", description: "Estudo de vasos cerâmicos moldados à mão. Cada peça guarda as marcas do gesto e da matéria.", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85", tags: ["cerâmica", "objeto", "matéria"], featured: false, published: true, order: 5 },
  { id: "p7", title: "Entrelinhas", category: "Editorial", year: "2022", description: "Uma série de capas para uma coleção de poesia contemporânea, com tipografia expressiva e papel de algodão.", image: "https://images.unsplash.com/photo-1455390582262-044c40f07f3d?auto=format&fit=crop&w=1200&q=85", tags: ["poesia", "capa", "tipografia"], featured: false, published: true, order: 6 },
  { id: "p8", title: "Estudo para jardim", category: "Ilustração", year: "2022", description: "Pequenas composições botânicas que investigam ritmo, cor e memória de um jardim inventado.", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85", tags: ["botânica", "cor", "estudo"], featured: false, published: true, order: 7 }
];
const defaultProfile = {
  displayName: "Ateliê",
  specialty: "Direção de arte\nDesign gráfico\nImagem & matéria",
  headlineOne: "Ideias em processo.",
  headlineTwo: "Trabalhos com intenção.",
  intro: "Um arquivo vivo de imagens, objetos e identidades feitos com tempo, curiosidade e cuidado.",
  bio: "Sou uma designer independente que trabalha entre identidade visual, imagem e objetos. Gosto de projetos que começam com uma boa pergunta e encontram sua forma no caminho.",
  contactEmail: "oi@atelie.studio",
  appearance: { theme: "atelier", accent: "#a95736", typeface: "classic", layout: "editorial", cardShape: "square", showAbout: true, showContact: true }
};

let currentUser = firebaseBackend.auth.currentUser;
let managing = false;
let activeFilter = "Todos";
let toastTimer;
let pendingImageFile = null;
let pendingPreviewUrl = null;
let authMode = "login";

function copyProjects(items) {
  return JSON.parse(JSON.stringify(items));
}
function orderedProjects() {
  return projects.slice().sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); });
}
function readProjects() {
  if (currentUser) {
    const collection = firebaseBackend.firestore.collection("projects", currentUser.uid);
    const existing = collection.get();
    if (Array.isArray(existing)) return existing;
    let seed = [];
    if (currentUser.uid === "atelier-demo-user") {
      seed = copyProjects(starterProjects);
    } else {
      try {
        const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
        if (Array.isArray(legacy)) seed = legacy;
      } catch (error) {}
    }
    collection.setAll(seed);
    return seed;
  }
  return copyProjects(starterProjects);
}
function readProfile() {
  if (!currentUser) return Object.assign({}, defaultProfile, { appearance: Object.assign({}, defaultProfile.appearance) });
  const stored = firebaseBackend.firestore.collection("profiles", currentUser.uid).get();
  return Object.assign({}, defaultProfile, stored || {}, {
    displayName: (stored && stored.displayName) || currentUser.displayName || "Meu ateliê",
    contactEmail: (stored && stored.contactEmail) || currentUser.email || "",
    appearance: Object.assign({}, defaultProfile.appearance, stored && stored.appearance || {})
  });
}
let projects = readProjects();
let profile = readProfile();

const grid = document.getElementById("projectGrid");
const filters = document.getElementById("filters");
const count = document.getElementById("projectCount");
const search = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const emptyCreate = document.getElementById("emptyCreate");
const manageToggle = document.getElementById("manageToggle");
const manageLabel = document.getElementById("manageLabel");
const manageHint = document.getElementById("manageHint");
const newProjectButton = document.getElementById("newProject");
const authDialog = document.getElementById("authDialog");
const authForm = document.getElementById("authForm");
const authError = document.getElementById("authError");
const profileDialog = document.getElementById("profileDialog");
const profileForm = document.getElementById("profileForm");
const editor = document.getElementById("editorDialog");
const detail = document.getElementById("projectDialog");
const form = document.getElementById("projectForm");
const toast = document.getElementById("toast");
const backendStatus = document.getElementById("backendStatus");

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
function getImageUrl(project) {
  const source = project && project.image ? firebaseBackend.storage.resolveUrl(project.image) : "";
  if (!source) return "";
  try {
    const parsed = new URL(source);
    return parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "data:" ? parsed.href : "";
  } catch (error) {
    return "";
  }
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () { toast.classList.remove("visible"); }, 2600);
}
function saveProjects() {
  if (!currentUser) return false;
  const saved = firebaseBackend.firestore.collection("projects", currentUser.uid).setAll(projects);
  if (!saved) showToast("Não foi possível salvar neste navegador.");
  return saved;
}
function applyAppearance(appearance) {
  const settings = Object.assign({}, defaultProfile.appearance, appearance || {});
  document.body.dataset.theme = settings.theme;
  document.body.dataset.typeface = settings.typeface;
  document.body.dataset.layout = settings.layout;
  document.body.dataset.cardShape = settings.cardShape;
  document.body.style.setProperty("--rust", settings.accent || defaultProfile.appearance.accent);
}
function applyProfileToPage() {
  const ownerName = profile.displayName || (currentUser && currentUser.displayName) || "Ateliê";
  document.getElementById("ownerName").textContent = ownerName;
  document.getElementById("profileSpecialty").innerHTML = escapeHtml(profile.specialty || "").replace(/\n/g, "<br>");
  document.getElementById("profileBio").textContent = profile.bio || "";
  document.getElementById("introLineOne").textContent = profile.headlineOne || defaultProfile.headlineOne;
  document.getElementById("introLineTwo").textContent = profile.headlineTwo || defaultProfile.headlineTwo;
  document.getElementById("introDescription").textContent = profile.intro || defaultProfile.intro;
  document.getElementById("sobre").hidden = profile.appearance.showAbout === false;
  const contact = document.getElementById("contactLink");
  contact.href = profile.contactEmail ? "mailto:" + profile.contactEmail : "#";
  contact.hidden = profile.appearance.showContact === false;
  applyAppearance(profile.appearance);
  document.getElementById("accountAction").textContent = currentUser ? "Meu perfil" : "Entrar";
}
function updateBackendLabel(user) {
  backendStatus.textContent = user ? "Firebase simulado · conta local" : "Firebase simulado · visitante";
}
function onAccountChanged(user) {
  currentUser = user;
  managing = false;
  activeFilter = "Todos";
  projects = readProjects();
  profile = readProfile();
  applyProfileToPage();
  render();
  updateBackendLabel(user);
  if (user && authDialog.open) authDialog.close();
  if (user) showToast("Seu portfólio pessoal está pronto.");
}
firebaseBackend.auth.onAuthStateChanged(onAccountChanged);

function visibleProjects() {
  const query = search.value.trim().toLocaleLowerCase("pt-BR");
  return orderedProjects().filter(function (project) {
    if (!managing && !project.published) return false;
    if (activeFilter !== "Todos" && project.category !== activeFilter) return false;
    const haystack = [project.title, project.category, project.description, (project.tags || []).join(" ")].join(" ").toLocaleLowerCase("pt-BR");
    return !query || haystack.indexOf(query) !== -1;
  });
}
function renderFilters() {
  const categories = ["Todos"].concat(Array.from(new Set(projects.map(function (project) { return project.category; }).filter(Boolean))).sort());
  if (activeFilter !== "Todos" && categories.indexOf(activeFilter) === -1) activeFilter = "Todos";
  filters.innerHTML = categories.map(function (category) {
    const selected = activeFilter === category;
    return '<button class="filter-chip' + (selected ? " active" : "") + '" type="button" data-filter="' + escapeHtml(category) + '" aria-pressed="' + selected + '">' + escapeHtml(category) + "</button>";
  }).join("");
}
function projectCard(project, index, total) {
  const image = getImageUrl(project);
  const status = project.published ? "" : '<span class="draft-ribbon">Rascunho</span>';
  const featured = project.featured ? '<span class="featured-mark" title="Projeto em destaque" aria-label="Projeto em destaque">✳</span>' : "";
  const actions = managing
    ? '<div class="card-actions"><button class="card-action" type="button" data-action="edit">Editar</button><button class="card-action" type="button" data-action="feature">' + (project.featured ? "Remover destaque" : "Destacar") + '</button><button class="card-action" type="button" data-action="publish">' + (project.published ? "Tornar rascunho" : "Publicar") + '</button><button class="card-action" type="button" data-action="up" aria-label="Mover projeto para cima">↑</button><button class="card-action" type="button" data-action="down" aria-label="Mover projeto para baixo">↓</button><button class="card-action danger" type="button" data-action="delete">Excluir</button></div>'
    : "";
  const summary = managing ? '<p class="project-description">' + escapeHtml(project.description) + "</p>" : "";
  const imageElement = image
    ? '<img class="project-image" src="' + escapeHtml(image) + '" alt="' + escapeHtml("Imagem do projeto " + project.title) + '" loading="' + (index < 3 ? "eager" : "lazy") + '">'
    : '<span class="project-image project-image-empty" aria-hidden="true">a.</span>';
  return '<article class="project-card' + (!project.published ? " is-draft" : "") + '" data-id="' + escapeHtml(project.id) + '">' +
    '<button class="project-image-button" type="button" data-action="view" aria-label="Ver projeto ' + escapeHtml(project.title) + '">' +
    imageElement + '<span class="image-index">' + String(index + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0") + "</span>" + featured + status + "</button>" +
    '<div class="project-meta"><div><h3 class="project-title">' + escapeHtml(project.title) + '</h3><p class="project-category">' + escapeHtml(project.category) + "</p></div><span class=\"project-year\">" + escapeHtml(project.year || "") + "</span></div>" +
    summary + actions + "</article>";
}
function render() {
  renderFilters();
  const items = visibleProjects();
  count.textContent = String(items.length).padStart(2, "0");
  grid.innerHTML = items.map(function (project, index) { return projectCard(project, index, items.length); }).join("");
  emptyState.hidden = items.length !== 0;
  grid.hidden = items.length === 0;
  manageToggle.setAttribute("aria-pressed", String(managing));
  manageLabel.textContent = managing ? "Concluir" : "Organizar";
  manageHint.hidden = !managing;
  newProjectButton.hidden = !managing;
}
function openAuth() {
  authError.hidden = true;
  authDialog.showModal();
}
function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === "signup";
  document.getElementById("nameRow").hidden = !signingUp;
  document.getElementById("authName").required = signingUp;
  document.getElementById("authPassword").autocomplete = signingUp ? "new-password" : "current-password";
  document.getElementById("authTitle").textContent = signingUp ? "Crie seu espaço criativo" : "Entre no seu ateliê";
  document.getElementById("authSubmit").innerHTML = (signingUp ? "Criar meu portfólio" : "Entrar") + ' <span aria-hidden="true">↗</span>';
  document.getElementById("loginTab").classList.toggle("active", !signingUp);
  document.getElementById("signupTab").classList.toggle("active", signingUp);
  document.getElementById("loginTab").setAttribute("aria-selected", String(!signingUp));
  document.getElementById("signupTab").setAttribute("aria-selected", String(signingUp));
  document.getElementById("demoLogin").hidden = signingUp;
  authError.hidden = true;
}
function updatePreview() {
  const title = document.getElementById("titleField").value.trim() || "Nome do seu projeto";
  const description = document.getElementById("descriptionField").value.trim() || "A descrição do projeto vai aparecer aqui, com o contexto e o processo que você quiser compartilhar.";
  const category = document.getElementById("categoryField").value || "Categoria";
  const year = document.getElementById("yearField").value.trim() || String(new Date().getFullYear());
  const tags = document.getElementById("tagsField").value.trim().split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
  const typedImage = document.getElementById("imageField").value.trim();
  let image = pendingPreviewUrl;
  if (!image && typedImage) {
    try { const parsed = new URL(typedImage); if (parsed.protocol === "https:" || parsed.protocol === "http:") image = parsed.href; } catch (error) {}
  }
  if (!image && document.getElementById("projectId").value) {
    const project = projects.find(function (item) { return item.id === document.getElementById("projectId").value; });
    if (project) image = getImageUrl(project);
  }
  document.getElementById("previewTitle").textContent = title;
  document.getElementById("previewDescription").textContent = description;
  document.getElementById("previewCategory").textContent = category.toUpperCase();
  document.getElementById("previewYear").textContent = year;
  document.getElementById("previewTags").textContent = tags.length ? tags.join(" · ").toUpperCase() : "SUAS PALAVRAS-CHAVE";
  document.getElementById("previewFeatured").hidden = !document.getElementById("featuredField").checked;
  const previewImage = document.getElementById("previewImage");
  const placeholder = document.getElementById("previewPlaceholder");
  previewImage.hidden = !image;
  placeholder.hidden = Boolean(image);
  if (image) previewImage.src = image;
}
function resetComposer(project) {
  form.reset();
  pendingImageFile = null;
  if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
  pendingPreviewUrl = null;
  document.getElementById("formError").hidden = true;
  document.getElementById("projectId").value = project ? project.id : "";
  document.getElementById("editorTitle").textContent = project ? "Ajuste sua apresentação" : "Monte sua apresentação";
  document.getElementById("titleField").value = project ? project.title : "";
  document.getElementById("categoryField").value = project ? project.category : "Identidade visual";
  document.getElementById("yearField").value = project ? project.year : new Date().getFullYear();
  document.getElementById("descriptionField").value = project ? project.description : "";
  document.getElementById("imageField").value = project && /^https?:/i.test(project.image || "") ? project.image : "";
  document.getElementById("tagsField").value = project && project.tags ? project.tags.join(", ") : "";
  document.getElementById("featuredField").checked = Boolean(project && project.featured);
  document.getElementById("publishedField").checked = project ? Boolean(project.published) : true;
  document.getElementById("imageFileField").value = "";
  updatePreview();
}
function openEditor(project) {
  resetComposer(project || null);
  editor.showModal();
  document.getElementById("titleField").focus();
}
function openProfile() {
  document.getElementById("profileNameField").value = profile.displayName || "";
  document.getElementById("profileSpecialtyField").value = profile.specialty || "";
  document.getElementById("profileHeadlineOne").value = profile.headlineOne || defaultProfile.headlineOne;
  document.getElementById("profileHeadlineTwo").value = profile.headlineTwo || defaultProfile.headlineTwo;
  document.getElementById("profileIntroField").value = profile.intro || defaultProfile.intro;
  document.getElementById("profileBioField").value = profile.bio || "";
  document.getElementById("profileEmailField").value = profile.contactEmail || "";
  const appearance = Object.assign({}, defaultProfile.appearance, profile.appearance || {});
  document.getElementById("themeField").value = appearance.theme;
  document.getElementById("accentField").value = appearance.accent;
  document.getElementById("typefaceField").value = appearance.typeface;
  document.getElementById("layoutField").value = appearance.layout;
  document.getElementById("cardShapeField").value = appearance.cardShape;
  document.getElementById("showAboutField").checked = appearance.showAbout !== false;
  document.getElementById("showContactField").checked = appearance.showContact !== false;
  switchProfilePanel("profile");
  updateAppearancePreview();
  profileDialog.showModal();
}
function openDetail(project) {
  const tags = (project.tags || []).map(function (tag) { return '<span class="detail-tag">' + escapeHtml(tag) + "</span>"; }).join("");
  const image = getImageUrl(project);
  const hero = image ? '<img class="detail-hero" src="' + escapeHtml(image) + '" alt="' + escapeHtml("Imagem do projeto " + project.title) + '">' : "";
  document.getElementById("projectDetail").innerHTML =
    hero + '<div class="detail-content"><p class="eyebrow"><span class="eyebrow-line"></span>' + escapeHtml(project.category) + "</p>" +
    '<h2 id="detailTitle">' + escapeHtml(project.title) + "</h2><div class=\"detail-data\"><span>" + escapeHtml(project.year || "Projeto autoral") + "</span><span>" + (project.featured ? "Seleção do arquivo" : "Projeto independente") + "</span></div>" +
    '<p class="detail-copy">' + escapeHtml(project.description) + "</p><div class=\"detail-tags\">" + tags + "</div></div>";
  detail.showModal();
}
function moveProject(id, direction) {
  const list = orderedProjects();
  const index = list.findIndex(function (project) { return project.id === id; });
  const next = index + direction;
  if (index < 0 || next < 0 || next >= list.length) return;
  const value = list[index].order;
  list[index].order = list[next].order;
  list[next].order = value;
  list.forEach(function (project, order) { project.order = order; });
  saveProjects();
  render();
}
async function persistProject(published) {
  const error = document.getElementById("formError");
  const title = document.getElementById("titleField").value.trim();
  const description = document.getElementById("descriptionField").value.trim();
  const rawImage = document.getElementById("imageField").value.trim();
  if (!title || !description) {
    error.textContent = "Adicione um título e conte um pouco sobre o projeto.";
    error.hidden = false;
    return;
  }
  if (!currentUser) {
    editor.close();
    return openAuth();
  }
  const existingId = document.getElementById("projectId").value;
  let project = projects.find(function (item) { return item.id === existingId; });
  const isNew = !project;
  if (isNew) {
    project = { id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : "p" + Date.now(), order: projects.length };
    projects.push(project);
  }
  try {
    let image = rawImage ? rawImage : (project.image || "");
    if (pendingImageFile) {
      image = await firebaseBackend.storage.uploadImage(pendingImageFile, currentUser.uid, project.id);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      pendingPreviewUrl = null;
      pendingImageFile = null;
    } else if (rawImage) {
      await firebaseBackend.storage.saveReference(currentUser.uid, project.id, rawImage);
    }
    project.title = title;
    project.category = document.getElementById("categoryField").value;
    project.year = document.getElementById("yearField").value.trim();
    project.description = description;
    project.image = image || "";
    project.tags = document.getElementById("tagsField").value.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
    project.featured = document.getElementById("featuredField").checked;
    project.published = published;
    if (!saveProjects()) throw new Error("Não foi possível salvar no banco local.");
    editor.close();
    render();
    showToast(published ? (isNew ? "Projeto publicado no seu portfólio." : "Apresentação publicada.") : "Rascunho salvo no seu espaço.");
  } catch (saveError) {
    error.textContent = saveError.message || "Não foi possível salvar este projeto.";
    error.hidden = false;
  }
}

filters.addEventListener("click", function (event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  render();
});
search.addEventListener("input", render);
manageToggle.addEventListener("click", function () {
  if (!currentUser) return openAuth();
  managing = !managing;
  activeFilter = "Todos";
  render();
  showToast(managing ? "Seu espaço de criação está aberto." : "Portfólio atualizado.");
});
document.getElementById("accountAction").addEventListener("click", function () { currentUser ? openProfile() : openAuth(); });
newProjectButton.addEventListener("click", function () { openEditor(null); });
emptyCreate.addEventListener("click", function () { currentUser ? openEditor(null) : openAuth(); });
document.getElementById("loginTab").addEventListener("click", function () { setAuthMode("login"); });
document.getElementById("signupTab").addEventListener("click", function () { setAuthMode("signup"); });
document.getElementById("demoLogin").addEventListener("click", function () {
  setAuthMode("login");
  document.getElementById("authEmail").value = "demo@atelie.local";
  document.getElementById("authPassword").value = "atelier-demo";
  authForm.requestSubmit();
});
authForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  authError.hidden = true;
  try {
    if (authMode === "signup") {
      await firebaseBackend.auth.createUserWithEmailAndPassword(
        document.getElementById("authName").value,
        document.getElementById("authEmail").value,
        document.getElementById("authPassword").value
      );
    } else {
      await firebaseBackend.auth.signInWithEmailAndPassword(
        document.getElementById("authEmail").value,
        document.getElementById("authPassword").value
      );
    }
  } catch (error) {
    authError.textContent = error.message || "Não foi possível acessar sua conta.";
    authError.hidden = false;
  }
});
document.getElementById("signOutButton").addEventListener("click", async function () {
  await firebaseBackend.auth.signOut();
  profileDialog.close();
  showToast("Você saiu do seu portfólio.");
});
function getAppearanceFromFields() {
  return {
    theme: document.getElementById("themeField").value,
    accent: document.getElementById("accentField").value,
    typeface: document.getElementById("typefaceField").value,
    layout: document.getElementById("layoutField").value,
    cardShape: document.getElementById("cardShapeField").value,
    showAbout: document.getElementById("showAboutField").checked,
    showContact: document.getElementById("showContactField").checked
  };
}
function switchProfilePanel(name) {
  const appearance = name === "appearance";
  document.getElementById("profilePanel").hidden = appearance;
  document.getElementById("appearancePanel").hidden = !appearance;
  document.querySelectorAll("[data-profile-panel]").forEach(function (button) {
    const selected = button.dataset.profilePanel === name;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}
function updateAppearancePreview() {
  const settings = getAppearanceFromFields();
  applyAppearance(settings);
  const name = document.getElementById("profileNameField").value.trim() || "Seu ateliê";
  const lineOne = document.getElementById("profileHeadlineOne").value.trim() || defaultProfile.headlineOne;
  const lineTwo = document.getElementById("profileHeadlineTwo").value.trim() || defaultProfile.headlineTwo;
  const intro = document.getElementById("profileIntroField").value.trim() || "Seu trabalho, sua linguagem, seu espaço.";
  document.getElementById("miniProfileName").textContent = name;
  document.getElementById("miniHeadline").innerHTML = escapeHtml(lineOne) + "<br><em>" + escapeHtml(lineTwo) + "</em>";
  document.getElementById("miniIntro").textContent = intro;
}
document.querySelectorAll("[data-profile-panel]").forEach(function (button) {
  button.addEventListener("click", function () { switchProfilePanel(button.dataset.profilePanel); });
});
["themeField", "accentField", "typefaceField", "layoutField", "cardShapeField", "showAboutField", "showContactField", "profileNameField", "profileHeadlineOne", "profileHeadlineTwo", "profileIntroField"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", updateAppearancePreview);
  document.getElementById(id).addEventListener("change", updateAppearancePreview);
});
document.getElementById("resetAppearance").addEventListener("click", function () {
  const appearance = defaultProfile.appearance;
  document.getElementById("themeField").value = appearance.theme;
  document.getElementById("accentField").value = appearance.accent;
  document.getElementById("typefaceField").value = appearance.typeface;
  document.getElementById("layoutField").value = appearance.layout;
  document.getElementById("cardShapeField").value = appearance.cardShape;
  document.getElementById("showAboutField").checked = appearance.showAbout;
  document.getElementById("showContactField").checked = appearance.showContact;
  updateAppearancePreview();
});
profileDialog.addEventListener("close", function () { applyProfileToPage(); });

profileForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!currentUser) return;
  profile = {
    displayName: document.getElementById("profileNameField").value.trim(),
    specialty: document.getElementById("profileSpecialtyField").value.trim(),
    headlineOne: document.getElementById("profileHeadlineOne").value.trim() || defaultProfile.headlineOne,
    headlineTwo: document.getElementById("profileHeadlineTwo").value.trim() || defaultProfile.headlineTwo,
    intro: document.getElementById("profileIntroField").value.trim() || defaultProfile.intro,
    bio: document.getElementById("profileBioField").value.trim(),
    contactEmail: document.getElementById("profileEmailField").value.trim(),
    appearance: getAppearanceFromFields()
  };
  firebaseBackend.firestore.collection("profiles", currentUser.uid).set(profile);
  applyProfileToPage();
  profileDialog.close();
  showToast("Seu perfil e identidade visual foram salvos.");
});

function useImageFile(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    document.getElementById("formError").textContent = "Escolha uma imagem JPG, PNG ou WebP.";
    document.getElementById("formError").hidden = false;
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    document.getElementById("formError").textContent = "A imagem deve ter até 2 MB.";
    document.getElementById("formError").hidden = false;
    return;
  }
  pendingImageFile = file;
  if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
  pendingPreviewUrl = URL.createObjectURL(file);
  document.getElementById("imageField").value = "";
  document.getElementById("formError").hidden = true;
  updatePreview();
}
document.getElementById("imageFileField").addEventListener("change", function (event) { useImageFile(event.target.files[0]); });
document.getElementById("uploadCard").addEventListener("dragover", function (event) { event.preventDefault(); event.currentTarget.classList.add("drag-over"); });
document.getElementById("uploadCard").addEventListener("dragleave", function (event) { event.currentTarget.classList.remove("drag-over"); });
document.getElementById("uploadCard").addEventListener("drop", function (event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  useImageFile(event.dataTransfer.files[0]);
});
document.getElementById("uploadCard").addEventListener("click", function (event) {
  if (event.target.id !== "imageFileField") document.getElementById("imageFileField").click();
});
["titleField", "descriptionField", "categoryField", "yearField", "tagsField", "featuredField", "imageField"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", updatePreview);
  document.getElementById(id).addEventListener("change", updatePreview);
});
document.getElementById("imageField").addEventListener("input", function () {
  pendingImageFile = null;
  if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
  pendingPreviewUrl = null;
  document.getElementById("imageFileField").value = "";
});
document.querySelectorAll("[data-preview-mode]").forEach(function (button) {
  button.addEventListener("click", function () {
    const mobile = button.dataset.previewMode === "mobile";
    document.getElementById("previewFrame").classList.toggle("mobile-mode", mobile);
    document.querySelectorAll("[data-preview-mode]").forEach(function (item) {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  });
});
form.addEventListener("submit", function (event) { event.preventDefault(); persistProject(true); });
document.getElementById("saveDraftButton").addEventListener("click", function () { persistProject(false); });

grid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest(".project-card");
  if (!button || !card) return;
  const project = projects.find(function (item) { return item.id === card.dataset.id; });
  if (!project) return;
  const action = button.dataset.action;
  if (action === "view") return openDetail(project);
  if (!managing || !currentUser) return;
  if (action === "edit") return openEditor(project);
  if (action === "delete") {
    if (!window.confirm('Excluir "' + project.title + '" do seu portfólio?')) return;
    projects = projects.filter(function (item) { return item.id !== project.id; });
    saveProjects();
    render();
    showToast("Projeto removido do seu espaço.");
  }
  if (action === "feature") {
    project.featured = !project.featured;
    saveProjects(); render(); showToast(project.featured ? "Projeto destacado." : "Destaque removido.");
  }
  if (action === "publish") {
    project.published = !project.published;
    saveProjects(); render(); showToast(project.published ? "Projeto publicado." : "Projeto salvo como rascunho.");
  }
  if (action === "up") moveProject(project.id, -1);
  if (action === "down") moveProject(project.id, 1);
});

document.querySelectorAll("[data-close]").forEach(function (button) {
  button.addEventListener("click", function () {
    const target = document.getElementById(button.dataset.close);
    if (target && target.open) target.close();
  });
});
[authDialog, profileDialog, editor, detail].forEach(function (dialog) {
  dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
});
editor.addEventListener("close", function () {
  if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
  pendingPreviewUrl = null;
  pendingImageFile = null;
});
applyProfileToPage();
render();