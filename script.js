// Everything lives in localStorage under one key - no backend, so clearing
// site data wipes the capsules. Fine for now.
const STORAGE_KEY = "capsules";

function loadCapsules() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function storeCapsules(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function sealCapsule() {
    const titleField = document.getElementById("title");
    const messageField = document.getElementById("message");
    const dateField = document.getElementById("unlockDate");

    const title = titleField.value.trim();
    const message = messageField.value.trim();
    const unlockDate = dateField.value;

    if (!title) {
        flashMessage("Please enter a title.");
        titleField.focus();
        return;
    }
    if (!message) {
        flashMessage("Please write a message.");
        messageField.focus();
        return;
    }
    if (!unlockDate) {
        flashMessage("Please choose an unlock date.");
        dateField.focus();
        return;
    }

    // datetime-local gives us a string with no timezone, so this is read as local time
    const chosenTime = new Date(unlockDate);
    if (chosenTime <= new Date()) {
        flashMessage("Choose a future date and time.");
        dateField.focus();
        return;
    }

    const newCapsule = {
        id: Date.now(),   // good enough as an id, nobody's making two in the same ms
        title: title,
        message: message,
        unlockDate: unlockDate,
        createdAt: new Date().toISOString(),
        notified: false
    };

    const saved = loadCapsules();
    saved.push(newCapsule);
    storeCapsules(saved);

    // clear the form
    titleField.value = "";
    messageField.value = "";
    dateField.value = "";

    renderCapsules();
    flashMessage("Capsule sealed successfully! 🔒");
}

function renderCapsules() {
    const list = document.getElementById("capsules");
    const saved = loadCapsules();

    list.innerHTML = "";

    if (saved.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No capsules yet</h3>
                <p>
                    Create your first capsule above
                    and leave something for your future self.
                </p>
            </div>
        `;
        return;
    }

    // newest first
    saved.sort((a, b) => b.id - a.id);

    saved.forEach(capsule => {
        const card = document.createElement("div");
        card.className = "capsule";

        const opensAt = new Date(capsule.unlockDate);
        const isReady = new Date() >= opensAt;

        if (isReady) {
            card.innerHTML = `
                <div class="capsule-header">
                    <span class="status unlocked">🔓 Unlocked</span>

                    <button class="delete-button" type="button"
                        onclick="deleteCapsule(${capsule.id})">
                        🗑️
                    </button>
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p class="unlock-info">This capsule is ready to open.</p>

                <button class="open-button" type="button"
                    onclick="openCapsule(${capsule.id})">
                    Open Capsule
                </button>
            `;
        } else {
            card.innerHTML = `
                <div class="capsule-header">
                    <span class="status locked">🔒 Locked</span>

                    <button class="delete-button" type="button"
                        onclick="deleteCapsule(${capsule.id})">
                        🗑️
                    </button>
                </div>

                <h3>${escapeHTML(capsule.title)}</h3>

                <p class="unlock-info">Opens on ${formatDate(capsule.unlockDate)}</p>

                <div class="countdown" data-date="${capsule.unlockDate}">
                    Calculating...
                </div>
            `;
        }

        list.appendChild(card);
    });

    // fill in the countdown text right away instead of waiting a second
    tickCountdowns();
}

function openCapsule(id) {
    const capsule = loadCapsules().find(c => c.id === id);
    if (!capsule) return;

    // the button only shows up once unlocked, but a stale tab could still call this
    if (new Date() < new Date(capsule.unlockDate)) {
        flashMessage("This capsule is still locked! 🔒");
        return;
    }

    // textContent on purpose - the message is user input
    document.getElementById("modalTitle").textContent = capsule.title;
    document.getElementById("modalMessage").textContent = capsule.message;
    document.getElementById("modalDate").textContent =
        "Created " + formatDate(capsule.createdAt);

    document.getElementById("capsuleModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("capsuleModal").classList.add("hidden");
}

function deleteCapsule(id) {
    if (!confirm("Are you sure you want to delete this capsule?")) {
        return;
    }

    const remaining = loadCapsules().filter(c => c.id !== id);
    storeCapsules(remaining);

    renderCapsules();
    flashMessage("Capsule deleted.");
}

function tickCountdowns() {
    const timers = document.querySelectorAll(".countdown");

    timers.forEach(timer => {
        const msLeft = new Date(timer.dataset.date).getTime() - Date.now();

        if (msLeft <= 0) {
            timer.textContent = "🔓 Unlocked";
            return;
        }

        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((msLeft / (1000 * 60)) % 60);
        const secs = Math.floor((msLeft / 1000) % 60);

        timer.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    });
}

// Runs every second. The `notified` flag stops us from popping up the same
// alert over and over once a capsule has unlocked.
function checkForUnlockedCapsules() {
    const saved = loadCapsules();
    let anyNewlyUnlocked = false;

    saved.forEach(capsule => {
        const ready = new Date() >= new Date(capsule.unlockDate);

        if (ready && capsule.notified !== true) {
            announceUnlock(capsule);
            capsule.notified = true;
            anyNewlyUnlocked = true;
        }
    });

    // only touch storage / re-render when something actually changed
    if (anyNewlyUnlocked) {
        storeCapsules(saved);
        renderCapsules();
    }
}

function announceUnlock(capsule) {
    // browser notification is a bonus, only if the user said yes earlier
    if ("Notification" in window && Notification.permission === "granted") {
        const readyNote = new Notification("⏳ Your Time Capsule is Ready!", {
            body: `"${capsule.title}" is ready to open.`
        });

        readyNote.onclick = function () {
            window.focus();
            openCapsule(capsule.id);
            readyNote.close();
        };
    }

    // in-page popup always shows, even if notifications are blocked
    showUnlockPopup(capsule);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// little toast in the corner
function flashMessage(text) {
    const toast = document.createElement("div");
    toast.className = "notification";
    toast.textContent = text;
    document.body.appendChild(toast);

    // tiny delay so the CSS transition actually fires
    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// titles get dropped into innerHTML above, so they have to be escaped
function escapeHTML(text) {
    const temp = document.createElement("div");
    temp.textContent = text;
    return temp.innerHTML;
}

function showUnlockPopup(capsule) {
    const popup = document.createElement("div");
    popup.className = "unlock-popup";

    popup.innerHTML = `
        <div class="popup-icon">🔓</div>

        <div class="popup-content">
            <strong>Your Time Capsule is Ready!</strong>
            <p>${escapeHTML(capsule.title)}</p>
        </div>

        <button type="button"
            onclick="openCapsule(${capsule.id}); this.parentElement.remove();">
            Open
        </button>

        <button type="button" class="popup-close"
            onclick="this.parentElement.remove();">
            ×
        </button>
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("show"), 10);
}

function askForNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// ---- wiring ----

document.getElementById("sealButton").addEventListener("click", sealCapsule);
document.getElementById("closeModal").addEventListener("click", closeModal);

// clicking the dark backdrop (but not the card itself) closes the modal
document.getElementById("capsuleModal").addEventListener("click", function (e) {
    if (e.target === this) closeModal();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
});

askForNotificationPermission();
renderCapsules();

setInterval(tickCountdowns, 1000);
setInterval(checkForUnlockedCapsules, 1000);
