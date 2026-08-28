function getCapsules() {
    return JSON.parse(localStorage.getItem("capsules")) || [];
}

function saveCapsules(capsules) {
    localStorage.setItem("capsules", JSON.stringify(capsules));
}

function createCapsule() {
    const titleInput = document.getElementById("title");
    const messageInput = document.getElementById("message");
    const dateInput = document.getElementById("unlockDate");

    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const unlockDate = dateInput.value;

    if (!title) {
        showNotification("Please enter a title.");
        titleInput.focus();
        return;
    }

    if (!message) {
        showNotification("Please write a message.");
        messageInput.focus();
        return;
    }

    if (!unlockDate) {
        showNotification("Please choose an unlock date.");
        dateInput.focus();
        return;
    }

    const selectedDate = new Date(unlockDate);
    const now = new Date();

    if (selectedDate <= now) {
        showNotification("Choose a future date and time.");
        dateInput.focus();
        return;
    }

    const capsule = {
        id: Date.now(),
        title: title,
        message: message,
        unlockDate: unlockDate,
        createdAt: new Date().toISOString(),
        notified: false
    };

    const capsules = getCapsules();

    capsules.push(capsule);

    saveCapsules(capsules);

    titleInput.value = "";
    messageInput.value = "";
    dateInput.value = "";

    displayCapsules();

    showNotification("Capsule sealed successfully! 🔒");
}

function displayCapsules() {
    const container = document.getElementById("capsules");
    const capsules = getCapsules();

    container.innerHTML = "";

    if (capsules.length === 0) {
        container.innerHTML = `
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

    capsules.sort((a, b) => b.id - a.id);

    capsules.forEach(capsule => {
        const card = document.createElement("div");

        card.className = "capsule";

        const unlockDate = new Date(capsule.unlockDate);
        const now = new Date();

        if (now >= unlockDate) {
            card.innerHTML = `
                <div class="capsule-header">
                    <span class="status unlocked">
                        🔓 Unlocked
                    </span>

                    <button
                        class="delete-button"
                        type="button"
                        onclick="deleteCapsule(${capsule.id})"
                    >
                        🗑️
                    </button>
                </div>

                <h3>
                    ${escapeHTML(capsule.title)}
                </h3>

                <p class="unlock-info">
                    This capsule is ready to open.
                </p>

                <button
                    class="open-button"
                    type="button"
                    onclick="openCapsule(${capsule.id})"
                >
                    Open Capsule
                </button>
            `;
        } else {
            card.innerHTML = `
                <div class="capsule-header">
                    <span class="status locked">
                        🔒 Locked
                    </span>

                    <button
                        class="delete-button"
                        type="button"
                        onclick="deleteCapsule(${capsule.id})"
                    >
                        🗑️
                    </button>
                </div>

                <h3>
                    ${escapeHTML(capsule.title)}
                </h3>

                <p class="unlock-info">
                    Opens on ${formatDate(capsule.unlockDate)}
                </p>

                <div
                    class="countdown"
                    data-date="${capsule.unlockDate}"
                >
                    Calculating...
                </div>
            `;
        }

        container.appendChild(card);
    });

    updateCountdowns();
}

function openCapsule(id) {
    const capsules = getCapsules();

    const capsule = capsules.find(
        capsule => capsule.id === id
    );

    if (!capsule) {
        return;
    }

    const unlockDate = new Date(capsule.unlockDate);
    const now = new Date();

    if (now < unlockDate) {
        showNotification("This capsule is still locked! 🔒");
        return;
    }

    document.getElementById("modalTitle").textContent =
        capsule.title;

    document.getElementById("modalMessage").textContent =
        capsule.message;

    document.getElementById("modalDate").textContent =
        "Created " + formatDate(capsule.createdAt);

    document
        .getElementById("capsuleModal")
        .classList.remove("hidden");
}

function closeModal() {
    document
        .getElementById("capsuleModal")
        .classList.add("hidden");
}

function deleteCapsule(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this capsule?"
    );

    if (!confirmed) {
        return;
    }

    let capsules = getCapsules();

    capsules = capsules.filter(
        capsule => capsule.id !== id
    );

    saveCapsules(capsules);

    displayCapsules();

    showNotification("Capsule deleted.");
}

function updateCountdowns() {
    const countdowns =
        document.querySelectorAll(".countdown");

    countdowns.forEach(element => {
        const target =
            new Date(element.dataset.date).getTime();

        const now =
            new Date().getTime();

        const difference = target - now;

        if (difference <= 0) {
            element.textContent ="🔓 Unlocked";
            return;
        }

        const days =
            Math.floor(
                difference /
                (1000 * 60 * 60 * 24)
            );

        const hours =
            Math.floor(
                (difference /
                    (1000 * 60 * 60)) % 24
            );

        const minutes =
            Math.floor(
                (difference /
                    (1000 * 60)) % 60
            );

        const seconds =
            Math.floor(
                (difference / 1000) % 60
            );

        element.textContent =
            `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });
}

function checkForUnlockedCapsules() {
    const capsules = getCapules();
    let changed = false;

    capsules.forEach(capsule => {
        const unlockDate = new Date(capsule.unlockDate);
        const now = new Date();

        if (
            now >= unlockDate &&
            capsule.notified !== true
        ) {
            showCapsuleNotification(capsule);

            capsule.notified = true;
            changed = true;
        }
    });

    if (changed) {
        savedCapsules(capsules);
        displayCapsules();
    }
}

function showCapsuleNotification(capsule) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        const notification = new Notification(
            "⏳ Your Time Capsule is Ready!",
            {
                body:
                    `"${capsule.title}" is ready to open.`
            }
        );

        notification.onclick = function() {
            window.focus();
            openCapsule(capsule.id);
            notification.close();
        };
    }

    showUnlockPopup(capsule);
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function showNotification(message) {
    const notification =
        document.createElement("div");

    notification.className =
        "notification";

    notification.textContent =
        message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("show");
    }, 10);

    setTimeout(() => {
        notification.classList.remove("show");

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2500);
}

function escapeHTML(text) {
    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

document
    .getElementById("sealButton")
    .addEventListener(
        "click",
        createCapsule
    );

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );

document
    .getElementById("capsuleModal")
    .addEventListener(
        "click",
        function(event) {
            if (event.target === this) {
                closeModal();
            }
        }
    );

document.addEventListener(
    "keydown",
    function(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }
);

requestNotificationPermission();

displayCapsules();

setInterval(
    updateCountdowns,
    1000
);

setInterval(
    checkForUnlockedCapsules,
    1000
);

function showUnlockPopup (capsule) {

    const popup = document.createElement("div");

    popup.className = "unlock-popup";

    popup.innerHTML = `
        <div class="popup-icon">🔓</div>

        <div class="popup-content">
            <strong>Your Time Capsule is Ready!</strong>
            <p>${escapeHTML(capsule.title)}</p>
        </div>

        <button
            type="button"
            onclick="openCapsule(${capsule.id}); this.parentElement.remove();"
        >
            Open
        </button>

        <button
            type="button"
            class="popup-close"
            onclick="this.parentElement.remove();"
        >
            ×
        </button>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.classList.add("show");
    }, 10);
}

function requestNotificationPermission() {

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {
        Notification.requestPermission();
    }
}

