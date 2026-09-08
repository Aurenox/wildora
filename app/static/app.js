"use strict";


// ============================================================
// WILDORA — FRONTEND APP
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// ELEMENTS
// ============================================================

const observeForm = $("observeForm");
const photoInput = $("photo");
const dropzone = $("dropzone");
const preview = $("preview");
const dropCopy = $("dropCopy");

const localityInput = $("locality");
const latitudeInput = $("latitude");
const longitudeInput = $("longitude");

const locateBtn = $("locateBtn");
const submitBtn = $("submitBtn");
const statusEl = $("status");

const result = $("result");

const resultTitle = $("resultTitle");
const realImage = $("realImage");
const realName = $("realName");
const latinName = $("latinName");
const confidence = $("confidence");
const taxonBadge = $("taxonBadge");

const habitatValue = $("habitatValue");
const roleValue = $("roleValue");
const qualityValue = $("qualityValue");
const funFact = $("funFact");
const safety = $("safety");

const rarity = $("rarity");
const creatureName = $("creatureName");
const tagline = $("tagline");
const lore = $("lore");
const abilities = $("abilities");
const fantasyVisual = $("fantasyVisual");

const xpBurst = $("xpBurst");
const xpToast = $("xpToast");

const statObs = $("statObs");
const statSpecies = $("statSpecies");
const statXp = $("statXp");
const statLevel = $("statLevel");

const levelPct = $("levelPct");
const levelBar = $("levelBar");
const levelMeta = $("levelMeta");
const nextLevelText = $("nextLevelText");

const atlasSpecies = $("atlasSpecies");
const badgeCount = $("badgeCount");
const taxonList = $("taxonList");
const badgeGrid = $("badgeGrid");
const collectionGrid = $("collectionGrid");


// ============================================================
// STATE
// ============================================================

let selectedFile = null;
let currentData = null;
let map = null;
let mapMarkers = [];


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupUpload();
        setupLocation();
        setupSamples();
        setupForm();

        loadObservations();
    }
);


// ============================================================
// UPLOAD
// ============================================================

function setupUpload() {

    if (!dropzone || !photoInput) {
        return;
    }


    dropzone.addEventListener(
        "click",
        (event) => {

            if (
                event.target === photoInput
            ) {
                return;
            }

            photoInput.click();
        }
    );


    photoInput.addEventListener(
        "change",
        () => {

            const file =
                photoInput.files?.[0];

            if (file) {

                handleFile(file);

            }

        }
    );


    [
        "dragenter",
        "dragover",
    ].forEach(
        (eventName) => {

            dropzone.addEventListener(
                eventName,
                (event) => {

                    event.preventDefault();

                    dropzone.classList.add(
                        "dragging"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop",
    ].forEach(
        (eventName) => {

            dropzone.addEventListener(
                eventName,
                (event) => {

                    event.preventDefault();

                    dropzone.classList.remove(
                        "dragging"
                    );

                }
            );

        }
    );


    dropzone.addEventListener(
        "drop",
        (event) => {

            const file =
                event.dataTransfer?.files?.[0];

            if (!file) {
                return;
            }

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showStatus(
                    "Please drop an image file.",
                    "error"
                );

                return;
            }


            selectedFile = file;

            try {

                const dataTransfer =
                    new DataTransfer();

                dataTransfer.items.add(file);

                photoInput.files =
                    dataTransfer.files;

            } catch (_) {
                // Browser may not allow assigning files.
            }


            showPreview(file);

        }
    );
}


// ============================================================
// FILE HANDLING
// ============================================================

function handleFile(file) {

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showStatus(
            "Please select a valid image.",
            "error"
        );

        return;
    }


    const maxSize =
        12 * 1024 * 1024;


    if (file.size > maxSize) {

        showStatus(
            "Image must be smaller than 12 MB.",
            "error"
        );

        return;
    }


    selectedFile = file;

    showPreview(file);

    clearStatus();
}


function showPreview(file) {

    if (!preview) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = () => {

        preview.src =
            reader.result;

        preview.hidden = false;

        if (dropCopy) {
            dropCopy.hidden = true;
        }

        dropzone?.classList.add(
            "has-preview"
        );
    };


    reader.readAsDataURL(file);
}


// ============================================================
// LOCATION
// ============================================================

function setupLocation() {

    if (!locateBtn) {
        return;
    }


    locateBtn.addEventListener(
        "click",
        () => {

            if (
                !navigator.geolocation
            ) {

                showStatus(
                    "Location is not supported by this browser.",
                    "error"
                );

                return;
            }


            locateBtn.disabled = true;

            locateBtn.textContent =
                "Locating…";


            navigator.geolocation.getCurrentPosition(

                (position) => {

                    const {
                        latitude,
                        longitude,
                    } = position.coords;


                    if (latitudeInput) {

                        latitudeInput.value =
                            latitude.toFixed(6);

                    }


                    if (longitudeInput) {

                        longitudeInput.value =
                            longitude.toFixed(6);

                    }


                    if (
                        localityInput &&
                        !localityInput.value.trim()
                    ) {

                        localityInput.value =
                            "Current location";

                    }


                    locateBtn.disabled =
                        false;

                    locateBtn.textContent =
                        "✓ Location added";


                    showStatus(
                        "Location added to your observation.",
                        "success"
                    );

                },


                (error) => {

                    locateBtn.disabled =
                        false;

                    locateBtn.textContent =
                        "Use my location";


                    let message =
                        "Could not get your location.";


                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        message =
                            "Location permission was denied.";

                    } else if (
                        error.code ===
                        error.POSITION_UNAVAILABLE
                    ) {

                        message =
                            "Your location is currently unavailable.";

                    } else if (
                        error.code ===
                        error.TIMEOUT
                    ) {

                        message =
                            "Location request timed out.";

                    }


                    showStatus(
                        message,
                        "error"
                    );

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                }

            );

        }
    );
}


// ============================================================
// SAMPLE BUTTONS
// ============================================================

function setupSamples() {

    const buttons =
        document.querySelectorAll(
            "[data-sample-id]"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const sampleId =
                        button.dataset.sampleId;

                    const imagePath =
                        button.dataset.image ||
                        button.querySelector(
                            "img"
                        )?.getAttribute(
                            "src"
                        );


                    if (
                        !sampleId ||
                        !imagePath
                    ) {

                        showStatus(
                            "Sample image is unavailable.",
                            "error"
                        );

                        return;
                    }


                    try {

                        button.disabled =
                            true;

                        button.classList.add(
                            "loading"
                        );


                        const response =
                            await fetch(
                                imagePath
                            );


                        if (!response.ok) {

                            throw new Error(
                                "Sample image not found."
                            );

                        }


                        const blob =
                            await response.blob();


                        const extension =
                            getExtension(
                                imagePath
                            );


                        const file =
                            new File(
                                [
                                    blob
                                ],
                                `${sampleId}${extension}`,
                                {
                                    type:
                                        blob.type ||
                                        "image/svg+xml",
                                }
                            );


                        selectedFile =
                            file;


                        if (photoInput) {

                            try {

                                const dt =
                                    new DataTransfer();

                                dt.items.add(
                                    file
                                );

                                photoInput.files =
                                    dt.files;

                            } catch (_) {}

                        }


                        showPreview(file);


                        if (
                            observeForm
                        ) {

                            observeForm.dataset.sampleId =
                                sampleId;

                        }


                        showStatus(
                            "Sample loaded. Click Identify with AI.",
                            "success"
                        );


                        observeForm?.scrollIntoView(
                            {
                                behavior: "smooth",
                                block: "center",
                            }
                        );


                    } catch (error) {

                        console.error(
                            error
                        );

                        showStatus(
                            "Could not load this sample.",
                            "error"
                        );

                    } finally {

                        button.disabled =
                            false;

                        button.classList.remove(
                            "loading"
                        );

                    }

                }
            );

        }
    );
}


function getExtension(path) {

    const clean =
        path.split("?")[0];

    const index =
        clean.lastIndexOf(".");


    if (index === -1) {
        return ".jpg";
    }


    return clean.substring(
        index
    );
}


// ============================================================
// FORM SUBMISSION
// ============================================================

function setupForm() {

    if (!observeForm) {
        return;
    }


    observeForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const file =
                selectedFile ||
                photoInput?.files?.[0];


            if (!file) {

                showStatus(
                    "Please choose a wildlife image first.",
                    "error"
                );

                return;
            }


            const formData =
                new FormData();


            formData.append(
                "photo",
                file
            );


            formData.append(
                "locality",
                localityInput?.value.trim() ||
                ""
            );


            formData.append(
                "latitude",
                latitudeInput?.value ||
                ""
            );


            formData.append(
                "longitude",
                longitudeInput?.value ||
                ""
            );


            formData.append(
                "sample_id",
                observeForm.dataset.sampleId ||
                ""
            );


            setLoading(
                true
            );


            showStatus(
                "Wildora is studying your observation…",
                "loading"
            );


            try {

                const response =
                    await fetch(
                        "/api/observe",
                        {
                            method: "POST",
                            body: formData,
                        }
                    );


                let data = null;


                try {

                    data =
                        await response.json();

                } catch (_) {

                    throw new Error(
                        "The server returned an invalid response."
                    );

                }


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Wildlife identification failed."
                    );

                }


                currentData =
                    data;


                renderResult(
                    data
                );


                renderProgress(
                    data.stats ||
                    data.progress
                );


                showStatus(
                    "Observation saved successfully.",
                    "success"
                );


                showXpReward(
                    data.xp_gained || 0,
                    data.level_up === true
                );


                await loadObservations();


                result?.scrollIntoView(
                    {
                        behavior: "smooth",
                        block: "start",
                    }
                );


            } catch (error) {

                console.error(
                    error
                );


                showStatus(
                    error.message ||
                    "Something went wrong.",
                    "error"
                );

            } finally {

                setLoading(
                    false
                );

            }

        }
    );
}


// ============================================================
// RESULT
// ============================================================

function renderResult(data) {

    const analysis =
        data.analysis || {};


    const creature =
        data.creature || null;


    if (result) {

        result.hidden = false;

        result.classList.remove(
            "result-visible"
        );


        requestAnimationFrame(
            () => {

                result.classList.add(
                    "result-visible"
                );

            }
        );

    }


    if (resultTitle) {

        resultTitle.textContent =
            analysis.common_name ||
            "Wildlife observation";

    }


    if (realName) {

        realName.textContent =
            analysis.common_name ||
            "Unknown species";

    }


    if (latinName) {

        latinName.textContent =
            analysis.scientific_name ||
            "Scientific name unavailable";

    }


    if (realImage) {

        if (data.photo_url) {

            realImage.src =
                data.photo_url;

            realImage.hidden =
                false;

        } else {

            realImage.hidden =
                true;

        }

    }


    if (confidence) {

        const value =
            Number(
                analysis.confidence || 0
            );


        confidence.textContent =
            `${Math.round(value * 100)}% confidence`;

    }


    if (taxonBadge) {

        taxonBadge.textContent =
            analysis.taxon_group ||
            analysis.taxonomic_group ||
            "Other";

    }


    if (habitatValue) {

        habitatValue.textContent =
            analysis.habitat_hint ||
            "Habitat information unavailable.";

    }


    if (roleValue) {

        roleValue.textContent =
            analysis.ecological_role ||
            "Part of the local ecosystem.";

    }


    if (qualityValue) {

        qualityValue.textContent =
            analysis.observation_quality ||
            "Good";

    }


    if (funFact) {

        funFact.textContent =
            analysis.fun_fact ||
            analysis.description ||
            "No additional fact available.";

    }


    if (safety) {

        safety.textContent =
            analysis.safety_note ||
            "Observe wildlife respectfully and maintain a safe distance.";

    }


    renderCreature(
        creature,
        data.creature_url
    );
}


// ============================================================
// CREATURE
// ============================================================

function renderCreature(
    creature,
    creatureUrl
) {

    if (!creature) {

        if (fantasyVisual) {
            fantasyVisual.hidden = true;
        }

        return;
    }


    if (fantasyVisual) {

        fantasyVisual.hidden = false;


        if (creatureUrl) {

            fantasyVisual.src =
                creatureUrl;

        } else {

            fantasyVisual.removeAttribute(
                "src"
            );

            fantasyVisual.alt =
                creature.name ||
                "Fantasy companion";

        }

    }


    if (creatureName) {

        creatureName.textContent =
            creature.name ||
            "Wild Spirit";

    }


    if (rarity) {

        rarity.textContent =
            creature.rarity ||
            "Rare";

    }


    if (tagline) {

        tagline.textContent =
            creature.tagline ||
            "";

    }


    if (lore) {

        lore.textContent =
            creature.lore ||
            "";

    }


    if (abilities) {

        abilities.innerHTML = "";


        const list =
            Array.isArray(
                creature.abilities
            )
                ? creature.abilities
                : [];


        list.forEach(
            (ability) => {

                const item =
                    document.createElement(
                        "li"
                    );


                item.textContent =
                    ability;


                abilities.appendChild(
                    item
                );

            }
        );

    }
}


// ============================================================
// XP REWARD
// ============================================================

function showXpReward(
    amount,
    levelUp
) {

    if (
        !xpBurst &&
        !xpToast
    ) {
        return;
    }


    if (xpToast) {

        if (levelUp) {

            xpToast.textContent =
                `LEVEL UP! +${amount} XP`;

        } else {

            xpToast.textContent =
                `+${amount} XP`;

        }


        xpToast.classList.remove(
            "show"
        );


        requestAnimationFrame(
            () => {

                xpToast.classList.add(
                    "show"
                );

            }
        );


        setTimeout(
            () => {

                xpToast.classList.remove(
                    "show"
                );

            },
            3500
        );

    }


    if (xpBurst) {

        xpBurst.classList.remove(
            "active"
        );


        requestAnimationFrame(
            () => {

                xpBurst.classList.add(
                    "active"
                );

            }
        );

    }
}


// ============================================================
// PROGRESS
// ============================================================

function renderProgress(data) {

    if (!data) {
        return;
    }


    const observations =
        Number(
            data.observations || 0
        );


    const species =
        Number(
            data.species || 0
        );


    const xp =
        Number(
            data.xp || 0
        );


    const level =
        Number(
            data.level || 1
        );


    const progress =
        Number(
            data.level_progress ??
            data.progress ??
            0
        );


    const xpIntoLevel =
        Number(
            data.xp_into_level ??
            0
        );


    const xpToNext =
        Number(
            data.xp_to_next_level ??
            Math.max(
                0,
                500 - xpIntoLevel
            )
        );


    if (statObs) {

        animateNumber(
            statObs,
            observations
        );

    }


    if (statSpecies) {

        animateNumber(
            statSpecies,
            species
        );

    }


    if (statXp) {

        animateNumber(
            statXp,
            xp
        );

    }


    if (statLevel) {

        animateNumber(
            statLevel,
            level
        );

    }


    if (levelPct) {

        levelPct.textContent =
            `${progress}%`;

    }


    if (levelBar) {

        levelBar.style.width =
            `${Math.min(
                100,
                Math.max(
                    0,
                    progress
                )
            )}%`;

    }


    if (levelMeta) {

        levelMeta.textContent =
            `${xpIntoLevel} / 500 XP`;

    }


    if (nextLevelText) {

        nextLevelText.textContent =
            `${xpToNext} XP to Level ${level + 1}`;

    }


    renderTaxonomy(
        data.groups
    );


    renderBadges(
        data.badges || []
    );


    if (atlasSpecies) {

        atlasSpecies.textContent =
            species;

    }


    if (badgeCount) {

        badgeCount.textContent =
            Array.isArray(
                data.unlocked_badges
            )
                ? data.unlocked_badges.length
                : data.badge_count || 0;

    }
}


// ============================================================
// NUMBER ANIMATION
// ============================================================

function animateNumber(
    element,
    target
) {

    const end =
        Number(target) || 0;


    const start =
        Number(
            element.textContent
                .replace(
                    /,/g,
                    ""
                )
        ) || 0;


    if (
        start === end
    ) {

        element.textContent =
            end.toLocaleString();

        return;
    }


    const duration = 500;

    const startTime =
        performance.now();


    function tick(now) {

        const elapsed =
            now - startTime;


        const progress =
            Math.min(
                1,
                elapsed / duration
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const value =
            Math.round(
                start +
                (
                    end - start
                ) * eased
            );


        element.textContent =
            value.toLocaleString();


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                tick
            );

        }

    }


    requestAnimationFrame(
        tick
    );
}


// ============================================================
// TAXONOMY
// ============================================================

function renderTaxonomy(
    groups
) {

    if (!taxonList) {
        return;
    }


    taxonList.innerHTML = "";


    if (
        !groups ||
        typeof groups !== "object"
    ) {

        return;
    }


    const entries =
        Object.entries(
            groups
        ).sort(
            (
                [, a],
                [, b]
            ) => b - a
        );


    entries.forEach(
        ([name, count]) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "taxon-row";


            row.innerHTML = `
                <span>${escapeHtml(name)}</span>
                <strong>${Number(count)}</strong>
            `;


            taxonList.appendChild(
                row
            );

        }
    );
}


// ============================================================
// BADGES
// ============================================================

function renderBadges(
    badges
) {

    if (!badgeGrid) {
        return;
    }


    badgeGrid.innerHTML = "";


    badges.forEach(
        (badge) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "badge-card";


            if (
                badge.unlocked
            ) {

                card.classList.add(
                    "unlocked"
                );

            } else {

                card.classList.add(
                    "locked"
                );

            }


            card.innerHTML = `
                <div class="badge-icon">
                    ${escapeHtml(
                        badge.icon || "✦"
                    )}
                </div>

                <div class="badge-copy">
                    <h3>
                        ${escapeHtml(
                            badge.name ||
                            "Badge"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            badge.description ||
                            ""
                        )}
                    </p>

                    <span class="badge-state">
                        ${
                            badge.unlocked
                                ? "Unlocked"
                                : "Locked"
                        }
                    </span>
                </div>
            `;


            badgeGrid.appendChild(
                card
            );

        }
    );
}


// ============================================================
// COLLECTION
// ============================================================

function renderCollection(
    items
) {

    if (!collectionGrid) {
        return;
    }


    collectionGrid.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        collectionGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◌</div>
                <h3>Your collection is waiting.</h3>
                <p>
                    Identify your first wildlife observation
                    to start building your Wildora collection.
                </p>
            </div>
        `;

        return;
    }


    items.forEach(
        (item) => {

            const analysis =
                item.analysis || {};


            const creature =
                item.creature || null;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "collection-card";


            const image =
                item.photo_url ||
                "";


            const location =
                item.locality ||
                "Location not recorded";


            card.innerHTML = `
                <div class="collection-image">
                    ${
                        image
                            ? `
                                <img
                                    src="${escapeAttribute(image)}"
                                    alt="${escapeAttribute(
                                        analysis.common_name ||
                                        "Wildlife"
                                    )}"
                                    loading="lazy"
                                >
                              `
                            : `
                                <div class="collection-placeholder">
                                    ◈
                                </div>
                              `
                    }

                    <span class="collection-group">
                        ${escapeHtml(
                            analysis.taxon_group ||
                            "Wildlife"
                        )}
                    </span>
                </div>

                <div class="collection-content">

                    <div class="collection-top">
                        <div>
                            <h3>
                                ${escapeHtml(
                                    analysis.common_name ||
                                    "Unknown species"
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    analysis.scientific_name ||
                                    "Scientific name unavailable"
                                )}
                            </p>
                        </div>

                        <span class="confidence-mini">
                            ${Math.round(
                                Number(
                                    analysis.confidence || 0
                                ) * 100
                            )}%
                        </span>
                    </div>

                    <div class="collection-meta">
                        <span>
                            📍 ${escapeHtml(location)}
                        </span>

                        ${
                            creature
                                ? `
                                    <span>
                                        ✦ ${escapeHtml(
                                            creature.name ||
                                            "Wild Spirit"
                                        )}
                                    </span>
                                  `
                                : ""
                        }
                    </div>

                </div>
            `;


            collectionGrid.appendChild(
                card
            );

        }
    );
}


// ============================================================
// LOAD OBSERVATIONS
// ============================================================

async function loadObservations() {

    try {

        const response =
            await fetch(
                "/api/observations",
                {
                    cache: "no-store",
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not load observations."
            );

        }


        const data =
            await response.json();


        const items =
            Array.isArray(
                data.items
            )
                ? data.items
                : Array.isArray(
                    data.observations
                )
                    ? data.observations
                    : [];


        const statistics =
            data.stats || {};


        currentData = {
            items,
            stats: statistics,
        };


        renderProgress(
            statistics
        );


        renderCollection(
            items
        );


        renderMap(
            items
        );


    } catch (error) {

        console.error(
            "[Wildora load error]",
            error
        );

    }
}


// ============================================================
// MAP
// ============================================================

function renderMap(
    items
) {

    if (!document.getElementById("map")) {
        return;
    }


    if (
        typeof L === "undefined"
    ) {

        return;
    }


    if (!map) {

        map = L.map(
            "map",
            {
                scrollWheelZoom: false,
            }
        ).setView(
            [
                20.5937,
                78.9629
            ],
            5
        );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }
        ).addTo(
            map
        );

    }


    mapMarkers.forEach(
        (marker) => {

            map.removeLayer(
                marker
            );

        }
    );


    mapMarkers = [];


    const located =
        items.filter(
            (item) =>
                Number.isFinite(
                    Number(
                        item.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        item.longitude
                    )
                )
        );


    located.forEach(
        (item) => {

            const analysis =
                item.analysis || {};


            const marker =
                L.marker(
                    [
                        Number(
                            item.latitude
                        ),
                        Number(
                            item.longitude
                        ),
                    ]
                ).addTo(
                    map
                );


            marker.bindPopup(
                `
                    <strong>
                        ${escapeHtml(
                            analysis.common_name ||
                            "Wildlife observation"
                        )}
                    </strong>
                    <br>
                    ${
                        escapeHtml(
                            item.locality ||
                            "Unknown location"
                        )
                    }
                `
            );


            mapMarkers.push(
                marker
            );

        }
    );


    if (located.length === 1) {

        map.setView(
            [
                Number(
                    located[0].latitude
                ),
                Number(
                    located[0].longitude
                ),
            ],
            12
        );

    } else if (
        located.length > 1
    ) {

        const bounds =
            L.latLngBounds(
                located.map(
                    (item) => [
                        Number(
                            item.latitude
                        ),
                        Number(
                            item.longitude
                        ),
                    ]
                )
            );


        map.fitBounds(
            bounds,
            {
                padding: [
                    30,
                    30,
                ],
                maxZoom: 12,
            }
        );

    }

}


// ============================================================
// STATUS
// ============================================================

function showStatus(
    message,
    type = "info"
) {

    if (!statusEl) {
        return;
    }


    statusEl.textContent =
        message;


    statusEl.className =
        `status ${type}`;

}


function clearStatus() {

    if (!statusEl) {
        return;
    }


    statusEl.textContent =
        "";


    statusEl.className =
        "status";

}


// ============================================================
// LOADING
// ============================================================

function setLoading(
    loading
) {

    if (!submitBtn) {
        return;
    }


    submitBtn.disabled =
        loading;


    if (loading) {

        submitBtn.dataset.originalText =
            submitBtn.textContent;


        submitBtn.textContent =
            "Analysing wildlife…";


        submitBtn.classList.add(
            "loading"
        );

    } else {

        submitBtn.textContent =
            submitBtn.dataset.originalText ||
            "Identify with AI ✦";


        submitBtn.classList.remove(
            "loading"
        );

    }
}


// ============================================================
// SECURITY HELPERS
// ============================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}