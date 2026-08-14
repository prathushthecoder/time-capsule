function createCapsule() {

    const title = document.getElementById("title").value;
    const message = document.getElementById("message").value;
    const unlockDate = document.getElementById("unlockDate").value;

    if (title === "" || message === "" || unlockDate === "") {
        alert("Please fill everything in.");
        return;
    }

    const capsule = {
        id: Date.now(),
        title: title,
        message: message,
        unlockDate: unlockDate
    };

    let capsules = JSON.parse(localStorage.getItem("capsules")) || [];

    capsules.push(capsule);

    localStorage.setItem("capsules", JSON.stringify(capsules));

    document.getElementById("title").value = "";
    document.getElementById("message").value = "";
    document.getElementById("unlockDate").value = "";

    displayCapsules();
}


function displayCapsules() {

    const container = document.getElementById("capsules");

    container.innerHTML = "";

    let capsules = JSON.parse(localStorage.getItem("capsules")) || [];

    capsules.forEach(capsule => {

        const today = new Date();
        const unlockDate = new Date(capsule.unlockDate);

        const card = document.createElement("div");

        card.classList.add("capsule");

        if (today >= unlockDate) {

            card.innerHTML = `
                <h3>🔓 ${capsule.title}</h3>

                <p class="unlocked">
                    Unlocked!
                </p>

                <button onclick="openCapsule(${capsule.id})">
                    Open Capsule
                </button>
            `;

        } else {

            card.innerHTML = `
                <h3>🔒 ${capsule.title}</h3>

                <p class="locked">
                    Locked until ${capsule.unlockDate}
                </p>
            `;
        }

        container.appendChild(card);
    });
}


function openCapsule(id) {

    let capsules = JSON.parse(localStorage.getItem("capsules")) || [];

    const capsule = capsules.find(c => c.id === id);

    if (!capsule) {
        return;
    }

    alert(
        capsule.title +
        "\n\n" +
        capsule.message
    );
}


displayCapsules();