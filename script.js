// MA'LUMOTLAR BAZASI
const initialData = {
    users: [
        { id: 1, name: "Admin", username: "admin", password: "admin123", role: "admin", category: "-" },
        { id: 2, name: "Aziz To'ro", username: "aziz_toro", password: "12345", role: "poet", category: "Zamonaviy she'riyat", bio: "Samarqandlik ijodkor va she'riyat shaydosi." },
        { id: 3, name: "Qodir Qaxxor", username: "qodir_qaxxor", password: "12345", role: "poet", category: "Mumtoz she'riyat", bio: "Serhosil shoir va publitsist." }
    ],
    poems: [
        {
            id: 101,
            authorId: 2,
            authorName: "Aziz To'ro",
            title: "Samarqand Taronasi",
            type: "text",
            category: "Zamonaviy she'riyat",
            content: "Moviy gumbazlarda porlaydi quyosh,\nMo'jiza poyida egiladi bosh.\nHar bitta g'ishingda adabiyot bor,\nSamarqand – qalbimga abadiy yo'ldosh.",
            date: "2026-09-28"
        },
        {
            id: 102,
            authorId: 3,
            authorName: "Qodir Qaxxor",
            title: "Turing dunyo turguncha ona",
            type: "video",
            category: "Mumtoz she'riyat",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            content: "Ona – bu xonadon chirog'i, hayot charog'oni...",
            date: "2026-09-29"
        }
    ]
};

let db = JSON.parse(localStorage.getItem('samarkand_ijodkorlari_db')) || initialData;
let currentUser = JSON.parse(localStorage.getItem('samarkand_user')) || null;

function saveDb() { 
    localStorage.setItem('samarkand_ijodkorlari_db', JSON.stringify(db)); 
}
function saveUser() { 
    localStorage.setItem('samarkand_user', JSON.stringify(currentUser)); 
}

// DASTUR ISHGA TUSHGANDA
window.onload = function() {
    updateAuthNav();
    renderFeed();
    renderSidebarPoets();
    renderPoetsDirectory();
    renderCategories();
};

// TABLARNI O'ZGARTIRISH
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if(targetTab) targetTab.classList.add('active');
    
    if (tabId === 'dashboard') {
        renderDashboard();
    }
}

// FEED RENDER
function renderFeed(filterCat = 'all', searchQuery = '') {
    const container = document.getElementById('feed-container');
    if (!container) return;
    container.innerHTML = '';

    let list = db.poems;
    if (filterCat !== 'all') {
        list = list.filter(p => p.category.includes(filterCat) || (filterCat === 'Audio/Video' && p.type === 'video'));
    }
    if (searchQuery) {
        list = list.filter(p => p.title.toLowerCase().includes(searchQuery) || p.authorName.toLowerCase().includes(searchQuery));
    }

    if (list.length === 0) {
        container.innerHTML = '<p style="padding:20px; color:gray;">Hozircha hech qanday ijod namunasi topilmadi.</p>';
        return;
    }

    list.forEach(poem => {
        const card = document.createElement('div');
        card.className = 'poem-card';
        card.innerHTML = `
            <div class="poem-author">
                <div class="author-avatar">${poem.authorName.charAt(0)}</div>
                <div>
                    <strong>${poem.authorName}</strong>
                    <div style="font-size:0.75rem; color:gray;">${poem.category} • ${poem.date}</div>
                </div>
            </div>
            <h3 class="poem-title" onclick="openPoemModal(${poem.id})">${poem.title}</h3>
            <div class="poem-excerpt">${poem.content.substring(0, 120)}...</div>
            <button class="btn btn-outline" onclick="openPoemModal(${poem.id})">Batafsil o'qish</button>
        `;
        container.appendChild(card);
    });
}

// FILTER BY CATEGORY
function filterByCategory(cat) {
    document.querySelectorAll('.filter-pills .pill').forEach(btn => btn.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    renderFeed(cat);
}

// AUTHENTICATION
function updateAuthNav() {
    const box = document.getElementById('auth-nav-box');
    if(!box) return;
    if (currentUser) {
        box.innerHTML = `
            <button class="btn btn-outline" onclick="showTab('dashboard')"><i class="fa-solid fa-user"></i> ${currentUser.name}</button>
            <button class="btn btn-danger" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i></button>
        `;
    } else {
        box.innerHTML = `<button class="btn btn-primary" onclick="toggleModal('login-modal', true)"><i class="fa-solid fa-right-to-bracket"></i> Kirish</button>`;
    }
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();

    const user = db.users.find(x => x.username === u && x.password === p);
    if (user) {
        currentUser = user;
        saveUser();
        updateAuthNav();
        toggleModal('login-modal', false);
        showTab('dashboard');
    } else {
        const err = document.getElementById('login-error');
        if(err) err.classList.remove('hidden');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('samarkand_user');
    updateAuthNav();
    showTab('home');
}

// DASHBOARD
function renderDashboard() {
    if (!currentUser) return;
    const header = document.getElementById('dashboard-user-info');
    if (header) header.innerHTML = `<h2>Xush kelibsiz, ${currentUser.name}! (${currentUser.role.toUpperCase()})</h2>`;

    const adminP = document.getElementById('admin-panel');
    const poetP = document.getElementById('poet-panel');

    if (currentUser.role === 'admin') {
        if(adminP) adminP.classList.remove('hidden');
        if(poetP) poetP.classList.add('hidden');
        renderAdminUsers();
    } else {
        if(poetP) poetP.classList.remove('hidden');
        if(adminP) adminP.classList.add('hidden');
    }
}

// ADMIN: SHOIR YARATISH
function handleCreateUser(e) {
    e.preventDefault();
    const newUser = {
        id: Date.now(),
        name: document.getElementById('new-poet-name').value,
        category: document.getElementById('new-poet-cat').value,
        username: document.getElementById('new-poet-login').value,
        password: document.getElementById('new-poet-pass').value,
        bio: document.getElementById('new-poet-bio').value,
        role: 'poet'
    };
    db.users.push(newUser);
    saveDb();
    renderAdminUsers();
    alert('Yangi shoir muvaffaqiyatli qo\'shildi!');
    e.target.reset();
}

function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    db.users.filter(u => u.role === 'poet').forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.category}</td>
                <td><code>${u.username}</code></td>
                <td><code>${u.password}</code></td>
                <td><button class="btn btn-danger" onclick="deleteUser(${u.id})">O'chirish</button></td>
            </tr>
        `;
    });
}

function deleteUser(id) {
    if (confirm("Rostdan ham o'chirmoqchimisiz?")) {
        db.users = db.users.filter(u => u.id !== id);
        saveDb();
        renderAdminUsers();
    }
}

// SHOIR: SHE'R CHOP ETISH
function handlePublishPoem(e) {
    e.preventDefault();
    const newPoem = {
        id: Date.now(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        title: document.getElementById('poem-title').value,
        type: document.getElementById('poem-type').value,
        category: currentUser.category || "Zamonaviy she'riyat",
        videoUrl: document.getElementById('poem-video-url').value,
        content: document.getElementById('poem-content').value,
        date: new Date().toISOString().split('T')[0]
    };
    db.poems.unshift(newPoem);
    saveDb();
    alert("She'r portalga muvaffaqiyatli joylandi!");
    e.target.reset();
    showTab('home');
    renderFeed();
}

// UTILS
function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.toggle('hidden', !show);
}

function filterPoems() {
    const q = document.getElementById('main-search').value.toLowerCase();
    renderFeed('all', q);
}

function openPoemModal(id) {
    const poem = db.poems.find(p => p.id === id);
    if (!poem) return;
    const content = document.getElementById('poem-modal-content');
    if (!content) return;
    content.innerHTML = `
        <h2 style="font-family:'Merriweather'; color:var(--primary); margin-bottom:10px;">${poem.title}</h2>
        <p style="color:gray; margin-bottom:20px;">Muallif: <strong>${poem.authorName}</strong> | ${poem.date}</p>
        <div style="font-style:italic; white-space:pre-line; font-size:1.1rem; line-height:1.8;">${poem.content}</div>
    `;
    toggleModal('poem-modal', true);
}

function toggleVideoInput() {
    const type = document.getElementById('poem-type').value;
    const el = document.getElementById('video-url-group');
    if(el) el.classList.toggle('hidden', type !== 'video');
}

function renderSidebarPoets() {
    const container = document.getElementById('featured-poets-container');
    if (!container) return;
    container.innerHTML = '';
    db.users.filter(u => u.role === 'poet').slice(0, 5).forEach(u => {
        container.innerHTML += `
            <div class="poet-item">
                <div class="author-avatar">${u.name.charAt(0)}</div>
                <div>
                    <strong>${u.name}</strong>
                    <div style="font-size:0.75rem; color:gray;">${u.category}</div>
                </div>
            </div>
        `;
    });
}

function renderPoetsDirectory() {
    const container = document.getElementById('poets-directory');
    if (!container) return;
    container.innerHTML = '';
    db.users.filter(u => u.role === 'poet').forEach(u => {
        container.innerHTML += `
            <div class="sidebar-card">
                <h3>${u.name}</h3>
                <p style="color:gray; font-size:0.85rem;">${u.category}</p>
                <p style="margin-top:10px;">${u.bio || "Ma'lumot berilmagan"}</p>
            </div>
        `;
    });
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    const cats = ["Zamonaviy she'riyat", "Mumtoz she'riyat", "Bahr-u Bayt", "Bolalar she'riyati"];
    container.innerHTML = '';
    cats.forEach(c => {
        container.innerHTML += `
            <div class="sidebar-card">
                <h3><i class="fa-solid fa-bookmark"></i> ${c}</h3>
                <p>Ushbu yo'nalishdagi Samarqand ijodkorlarining eng saralangan asarlari.</p>
            </div>
        `;
    });
}
