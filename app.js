const STORAGE_KEY = "atelier-portfolio-projects-v1";
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

function readProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return starterProjects.map(function (project) { return Object.assign({}, project, { tags: project.tags.slice() }); });
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : starterProjects.slice();
  } catch (error) {
    return starterProjects.slice();
  }
}

let projects = readProjects();
let managing = false;
let activeFilter = "Todos";
let toastTimer;

const grid = document.getElementById("projectGrid");
const filters = document.getElementById("filters");
const count = document.getElementById("projectCount");
const search = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const manageToggle = document.getElementById("manageToggle");
const manageLabel = document.getElementById("manageLabel");
const manageHint = document.getElementById("manageHint");
const newProjectButton = document.getElementById("newProject");
const editor = document.getElementById("editorDialog");
const detail = document.getElementById("projectDialog");
const form = document.getElementById("projectForm");
const toast = document.getElementById("toast");

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

function imageUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : fallbackImage;
  } catch (error) {
    return fallbackImage;
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    showToast("Não foi possível salvar neste navegador.");
    return false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () { toast.classList.remove("visible"); }, 2600);
}

function orderedProjects() {
  return projects.slice().sort(function (a, b) { return Number(a.order || 0) - Number(b.order || 0); });
}

function renderFilters() {
  const categories = ["Todos"].concat(Array.from(new Set(projects.map(function (project) { return project.category; }).filter(Boolean))).sort());
  if (activeFilter !== "Todos" && categories.indexOf(activeFilter) === -1) activeFilter = "Todos";
  filters.innerHTML = categories.map(function (category) {
    const selected = activeFilter === category;
    return '<button class="filter-chip' + (selected ? " active" : "") + '" type="button" data-filter="' + escapeHtml(category) + '" aria-pressed="' + selected + '">' + escapeHtml(category) + "</button>";
  }).join("");
}

function visibleProjects() {
  const query = search.value.trim().toLocaleLowerCase("pt-BR");
  return orderedProjects().filter(function (project) {
    if (!managing && !project.published) return false;
    if (activeFilter !== "Todos" && project.category !== activeFilter) return false;
    const haystack = [project.title, project.category, project.description, (project.tags || []).join(" ")].join(" ").toLocaleLowerCase("pt-BR");
    return !query || haystack.indexOf(query) !== -1;
  });
}

function projectCard(project, index) {
  const draftClass = project.published ? "" : " is-draft";
  const imageAlt = "Imagem do projeto " + project.title;
  const image = imageUrl(project.image);
  const status = project.published ? "" : '<span class="draft-ribbon">Rascunho</span>';
  const featured = project.featured ? '<span class="featured-mark" title="Projeto em destaque" aria-label="Projeto em destaque">✳</span>' : "";
  const actions = managing
    ? '<div class="card-actions">' +
      '<button class="card-action" type="button" data-action="edit">Editar</button>' +
      '<button class="card-action" type="button" data-action="feature">' + (project.featured ? "Remover destaque" : "Destacar") + '</button>' +
      '<button class="card-action" type="button" data-action="publish">' + (project.published ? "Tornar rascunho" : "Publicar") + '</button>' +
      '<button class="card-action" type="button" data-action="up" aria-label="Mover projeto para cima">↑</button>' +
      '<button class="card-action" type="button" data-action="down" aria-label="Mover projeto para baixo">↓</button>' +
      '<button class="card-action danger" type="button" data-action="delete">Excluir</button>' +
      "</div>"
    : "";
  const summary = managing ? '<p class="project-description">' + escapeHtml(project.description) + "</p>" : "";
  return '<article class="project-card' + draftClass + '" data-id="' + escapeHtml(project.id) + '">' +
    '<button class="project-image-button" type="button" data-action="view" aria-label="Ver projeto ' + escapeHtml(project.title) + '">' +
    '<img class="project-image" src="' + escapeHtml(image) + '" alt="' + escapeHtml(imageAlt) + '" loading="' + (index < 3 ? "eager" : "lazy") + '" onerror="this.onerror=null;this.src=\'' + fallbackImage + '\'">' +
    '<span class="image-index">' + String(index + 1).padStart(2, "0") + " / " + String(visibleProjects().length).padStart(2, "0") + "</span>" + featured + status + "</button>" +
    '<div class="project-meta"><div><h3 class="project-title">' + escapeHtml(project.title) + '</h3><p class="project-category">' + escapeHtml(project.category) + "</p></div><span class=\"project-year\">" + escapeHtml(project.year || "") + "</span></div>" +
    summary + actions + "</article>";
}

function render() {
  renderFilters();
  const items = visibleProjects();
  count.textContent = String(items.length).padStart(2, "0");
  grid.innerHTML = items.map(projectCard).join("");
  emptyState.hidden = items.length !== 0;
  grid.hidden = items.length === 0;
  manageToggle.setAttribute("aria-pressed", String(managing));
  manageLabel.textContent = managing ? "Concluir" : "Organizar";
  manageHint.hidden = !managing;
  newProjectButton.hidden = !managing;
}

function openEditor(project) {
  form.reset();
  document.getElementById("formError").hidden = true;
  document.getElementById("projectId").value = project ? project.id : "";
  document.getElementById("editorTitle").textContent = project ? "Editar projeto" : "Novo projeto";
  document.getElementById("titleField").value = project ? project.title : "";
  document.getElementById("categoryField").value = project ? project.category : "Identidade visual";
  document.getElementById("yearField").value = project ? project.year : new Date().getFullYear();
  document.getElementById("descriptionField").value = project ? project.description : "";
  document.getElementById("imageField").value = project ? project.image : "";
  document.getElementById("tagsField").value = project && project.tags ? project.tags.join(", ") : "";
  document.getElementById("featuredField").checked = Boolean(project && project.featured);
  document.getElementById("publishedField").checked = project ? Boolean(project.published) : true;
  editor.showModal();
  document.getElementById("titleField").focus();
}

function openDetail(project) {
  const tags = (project.tags || []).map(function (tag) { return '<span class="detail-tag">' + escapeHtml(tag) + "</span>"; }).join("");
  document.getElementById("projectDetail").innerHTML =
    '<img class="detail-hero" src="' + escapeHtml(imageUrl(project.image)) + '" alt="' + escapeHtml("Imagem do projeto " + project.title) + '" onerror="this.onerror=null;this.src=\'' + fallbackImage + '\'">' +
    '<div class="detail-content"><p class="eyebrow"><span class="eyebrow-line"></span>' + escapeHtml(project.category) + "</p>" +
    '<h2 id="detailTitle">' + escapeHtml(project.title) + "</h2>" +
    '<div class="detail-data"><span>' + escapeHtml(project.year || "Projeto autoral") + "</span><span>" + (project.featured ? "Seleção do arquivo" : "Projeto independente") + "</span></div>" +
    '<p class="detail-copy">' + escapeHtml(project.description) + "</p><div class=\"detail-tags\">" + tags + "</div></div>";
  detail.showModal();
}

function moveProject(id, direction) {
  const list = orderedProjects();
  const index = list.findIndex(function (project) { return project.id === id; });
  const next = index + direction;
  if (index < 0 || next < 0 || next >= list.length) return;
  const currentOrder = list[index].order;
  list[index].order = list[next].order;
  list[next].order = currentOrder;
  if (list[index].order === list[next].order) {
    list.forEach(function (project, order) { project.order = order; });
  }
  saveProjects();
  render();
}

filters.addEventListener("click", function (event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  render();
});

search.addEventListener("input", render);
manageToggle.addEventListener("click", function () {
  managing = !managing;
  activeFilter = "Todos";
  render();
  showToast(managing ? "Modo de organização ativado." : "Portfólio atualizado.");
});
newProjectButton.addEventListener("click", function () { openEditor(null); });

grid.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest(".project-card");
  if (!button || !card) return;
  const project = projects.find(function (item) { return item.id === card.dataset.id; });
  if (!project) return;
  const action = button.dataset.action;
  if (action === "view") return openDetail(project);
  if (!managing) return;
  if (action === "edit") return openEditor(project);
  if (action === "delete") {
    if (!window.confirm('Excluir "' + project.title + '" do arquivo?')) return;
    projects = projects.filter(function (item) { return item.id !== project.id; });
    saveProjects();
    render();
    showToast("Projeto removido do arquivo.");
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

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const id = document.getElementById("projectId").value;
  const title = document.getElementById("titleField").value.trim();
  const description = document.getElementById("descriptionField").value.trim();
  const rawImage = document.getElementById("imageField").value.trim();
  const image = rawImage ? imageUrl(rawImage) : fallbackImage;
  if (!title || !description) {
    const error = document.getElementById("formError");
    error.textContent = "Preencha o título e a descrição para salvar.";
    error.hidden = false;
    return;
  }
  let project = projects.find(function (item) { return item.id === id; });
  const isNew = !project;
  if (isNew) {
    project = { id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : "p" + Date.now(), order: projects.length };
    projects.push(project);
  }
  project.title = title;
  project.category = document.getElementById("categoryField").value;
  project.year = document.getElementById("yearField").value.trim();
  project.description = description;
  project.image = image;
  project.tags = document.getElementById("tagsField").value.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
  project.featured = document.getElementById("featuredField").checked;
  project.published = document.getElementById("publishedField").checked;
  saveProjects();
  editor.close();
  render();
  showToast(isNew ? "Projeto adicionado ao arquivo." : "Projeto atualizado.");
});

document.querySelectorAll("[data-close]").forEach(function (button) {
  button.addEventListener("click", function () {
    const target = document.getElementById(button.dataset.close);
    if (target && target.open) target.close();
  });
});

[detail, editor].forEach(function (dialog) {
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
});

render();