/* =========================================================
   WILDORA — FINAL FRONTEND
   =========================================================
   Features:
   - Wildlife image upload
   - Sample wildlife images
   - Real Leaflet map
   - Click map to select location
   - Draggable location marker
   - Current GPS location
   - Wildlife landmarks
   - Use landmark as location
   - Save latitude / longitude / locality
   - AI observation submission
   - Biodiversity Atlas
   - Previous observation markers
   - Observation details
   - Dashboard statistics
   - Collection
   - Badges
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =====================================================
       ELEMENT HELPER
       ===================================================== */

    const $ = (id) => document.getElementById(id);


    /* =====================================================
       OBSERVATION ELEMENTS
       ===================================================== */

    const observeForm = $("observeForm");
    const photoInput = $("photo");
    const dropzone = $("dropzone");
    const preview = $("preview");
    const dropCopy = $("dropCopy");

    const localityInput = $("locality");
    const latitudeInput = $("latitude");
    const longitudeInput = $("longitude");

    const submitBtn = $("submitBtn");
    const status = $("status");


    /* =====================================================
       LOCATION ELEMENTS
       ===================================================== */

    const selectMapLocationBtn = $("selectMapLocationBtn");
    const locateBtn = $("locateBtn");

    const selectedLocation = $("selectedLocation");
    const selectedLocationName = $("selectedLocationName");
    const selectedLatitude = $("selectedLatitude");
    const selectedLongitude = $("selectedLongitude");


    /* =====================================================
       LOCATION MODAL
       ===================================================== */

    const locationModal = $("locationModal");
    const locationBackdrop = $("locationBackdrop");
    const closeLocationModal = $("closeLocationModal");
    const locationPickerMapEl = $("locationPickerMap");

    const pickerLatitude = $("pickerLatitude");
    const pickerLongitude = $("pickerLongitude");
    const pickerLocation = $("pickerLocation");

    const pickerCurrentLocation = $("pickerCurrentLocation");

    const confirmLocation = $("confirmLocation");
    const cancelLocation = $("cancelLocation");


    /* =====================================================
       LANDMARK ELEMENTS
       ===================================================== */

    const landmarkGrid = $("landmarkGrid");
    const landmarkDetail = $("landmarkDetail");


    /* =====================================================
       ATLAS ELEMENTS
       ===================================================== */

    const atlasMapEl = $("map");
    const atlasSpecies = $("atlasSpecies");
    const atlasObservationList = $("atlasObservationList");
    const atlasDetail = $("atlasDetail");


    /* =====================================================
       RESULT ELEMENTS
       ===================================================== */

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

    const creatureName = $("creatureName");
    const rarity = $("rarity");
    const tagline = $("tagline");
    const lore = $("lore");
    const abilities = $("abilities");

    const fantasyVisual = $("fantasyVisual");


    /* =====================================================
       DASHBOARD ELEMENTS
       ===================================================== */

    const statLevel = $("statLevel");
    const statObs = $("statObs");
    const statSpecies = $("statSpecies");
    const statXp = $("statXp");

    const levelPct = $("levelPct");
    const levelBar = $("levelBar");
    const levelMeta = $("levelMeta");
    const nextLevelText = $("nextLevelText");

    const badgeCount = $("badgeCount");
    const badgeGrid = $("badgeGrid");

    const taxonList = $("taxonList");
    const collectionGrid = $("collectionGrid");

    const xpToast = $("xpToast");
    const xpBurst = $("xpBurst");


    /* =====================================================
       STATE
       ===================================================== */

    let selectedFile = null;

    let pickerMap = null;
    let atlasMap = null;

    let pickerSelectedMarker = null;
    let atlasSelectedMarker = null;

    let observations = [];

    let pickerLat = null;
    let pickerLng = null;
    let pickerPlaceName = "";

    let currentLocationLat = null;
    let currentLocationLng = null;


    /* =====================================================
       WILDLIFE LANDMARKS
       ===================================================== */

    const landmarks = [

        {
            name: "Periyar Wildlife Sanctuary",
            lat: 9.4626,
            lng: 77.1710,
            region: "Kerala",
            animals:
                "Asian elephant, Bengal tiger, gaur, sambar deer, wild boar and many bird species."
        },

        {
            name: "Wayanad Wildlife Sanctuary",
            lat: 11.6850,
            lng: 76.1320,
            region: "Kerala",
            animals:
                "Asian elephant, gaur, leopard, sambar deer, spotted deer, wild boar and birds."
        },

        {
            name: "Silent Valley National Park",
            lat: 11.0776,
            lng: 76.4344,
            region: "Kerala",
            animals:
                "Lion-tailed macaque, Nilgiri langur, Malabar giant squirrel, frogs and many forest birds."
        },

        {
            name: "Thattekad Bird Sanctuary",
            lat: 10.1076,
            lng: 76.6720,
            region: "Kerala",
            animals:
                "Malabar grey hornbill, Indian pitta, kingfishers, woodpeckers and butterflies."
        },

        {
            name: "Bandipur National Park",
            lat: 11.6666,
            lng: 76.6286,
            region: "Karnataka",
            animals:
                "Asian elephant, tiger, leopard, gaur, dhole, sambar and spotted deer."
        },

        {
            name: "Kaziranga National Park",
            lat: 26.5775,
            lng: 93.1711,
            region: "Assam",
            animals:
                "Greater one-horned rhinoceros, Asian elephant, wild water buffalo, tiger and swamp deer."
        },

        {
            name: "Gir National Park",
            lat: 21.1240,
            lng: 70.8242,
            region: "Gujarat",
            animals:
                "Asiatic lion, leopard, chital, sambar, nilgai and many bird species."
        },

        {
            name: "Ranthambore National Park",
            lat: 26.0173,
            lng: 76.5026,
            region: "Rajasthan",
            animals:
                "Bengal tiger, leopard, sloth bear, sambar, chital and crocodiles."
        }

    ];


    /* =====================================================
       UTILITY FUNCTIONS
       ===================================================== */

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function number(value, digits = 6) {

        const n = Number(value);

        if (!Number.isFinite(n)) {
            return "";
        }

        return n.toFixed(digits);
    }


    function validCoordinatePair(lat, lng) {

        const latitude = Number(lat);
        const longitude = Number(lng);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return false;
        }

        if (
            latitude < -90 ||
            latitude > 90
        ) {
            return false;
        }

        if (
            longitude < -180 ||
            longitude > 180
        ) {
            return false;
        }

        /*
         0,0 is used by Wildora as
         "location not recorded".
        */

        if (
            latitude === 0 &&
            longitude === 0
        ) {
            return false;
        }

        return true;
    }


    function safeJSON(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return {};
        }

        if (
            typeof value === "object"
        ) {
            return value;
        }

        try {

            return JSON.parse(value);

        } catch {

            return {};

        }
    }


    function firstValue(...values) {

        for (
            const value of values
        ) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {

                return value;

            }
        }

        return "";
    }


    /* =====================================================
       STATUS
       ===================================================== */

    function showStatus(
        message,
        type = "info"
    ) {

        if (!status) {
            return;
        }

        status.textContent = message;
        status.dataset.type = type;
        status.style.display = "block";
    }


    function clearStatus() {

        if (!status) {
            return;
        }

        status.textContent = "";
        status.style.display = "none";
    }


    /* =====================================================
       IMAGE UPLOAD
       ===================================================== */

    function showPreview(file) {

        if (!preview) {
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            preview.src = reader.result;
            preview.hidden = false;

            if (dropCopy) {
                dropCopy.hidden = true;
            }
        };

        reader.readAsDataURL(file);
    }


    function handleFile(file) {

        if (!file) {
            return;
        }

        if (
            !file.type ||
            !file.type.startsWith("image/")
        ) {

            showStatus(
                "Please select a valid image.",
                "error"
            );

            return;
        }

        if (
            file.size >
            12 * 1024 * 1024
        ) {

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


    if (photoInput) {

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
    }


    if (dropzone) {

        dropzone.addEventListener(
            "dragover",
            (event) => {

                event.preventDefault();

                dropzone.classList.add(
                    "dragging"
                );
            }
        );


        dropzone.addEventListener(
            "dragleave",
            () => {

                dropzone.classList.remove(
                    "dragging"
                );
            }
        );


        dropzone.addEventListener(
            "drop",
            (event) => {

                event.preventDefault();

                dropzone.classList.remove(
                    "dragging"
                );

                const file =
                    event.dataTransfer?.files?.[0];

                if (!file) {
                    return;
                }

                handleFile(file);

                try {

                    const transfer =
                        new DataTransfer();

                    transfer.items.add(file);

                    photoInput.files =
                        transfer.files;

                } catch (_) {}
            }
        );
    }


    /* =====================================================
       SAMPLE CARDS
       ===================================================== */

    document
        .querySelectorAll(
            "[data-sample-id]"
        )
        .forEach(
            (card) => {

                card.addEventListener(
                    "click",
                    async () => {

                        const sampleId =
                            card.dataset.sampleId ||
                            "";

                        const imageURL =
                            card.dataset.image ||
                            "";

                        if (!imageURL) {
                            return;
                        }

                        showStatus(
                            "Loading sample observation...",
                            "info"
                        );

                        try {

                            const response =
                                await fetch(imageURL);

                            if (!response.ok) {

                                throw new Error(
                                    "Sample image could not be loaded."
                                );
                            }

                            const blob =
                                await response.blob();

                            const file =
                                new File(
                                    [blob],
                                    `${sampleId || "sample"}.svg`,
                                    {
                                        type:
                                            blob.type ||
                                            "image/svg+xml"
                                    }
                                );

                            selectedFile = file;

                            if (photoInput) {

                                try {

                                    const transfer =
                                        new DataTransfer();

                                    transfer.items.add(file);

                                    photoInput.files =
                                        transfer.files;

                                } catch (_) {}
                            }

                            showPreview(file);

                            if (observeForm) {

                                observeForm.dataset.sampleId =
                                    sampleId;
                            }

                            showStatus(
                                `Sample selected${sampleId ? `: ${sampleId}` : ""}. Click Identify with AI.`,
                                "success"
                            );

                        } catch (error) {

                            console.error(error);

                            showStatus(
                                "Could not load sample image.",
                                "error"
                            );
                        }
                    }
                );
            }
        );


    /* =====================================================
       SELECTED LOCATION UI
       ===================================================== */

    function updateSelectedLocationUI(
        lat,
        lng,
        name
    ) {

        if (
            !validCoordinatePair(
                lat,
                lng
            )
        ) {
            return;
        }

        if (selectedLocation) {

            selectedLocation.style.display =
                "block";

            selectedLocation.hidden =
                false;
        }

        if (selectedLatitude) {

            selectedLatitude.textContent =
                number(lat);
        }

        if (selectedLongitude) {

            selectedLongitude.textContent =
                number(lng);
        }

        if (selectedLocationName) {

            selectedLocationName.textContent =
                name ||
                "Selected map location";
        }
    }


    /* =====================================================
       WRITE LOCATION TO FORM
       ===================================================== */

    function writeLocationToForm(
        lat,
        lng,
        name = ""
    ) {

        const latitude = Number(lat);
        const longitude = Number(lng);

        if (
            !validCoordinatePair(
                latitude,
                longitude
            )
        ) {

            console.error(
                "Invalid location:",
                lat,
                lng
            );

            return false;
        }

        /*
         THESE ARE THE ACTUAL VALUES
         SUBMITTED TO FASTAPI.
        */

        if (latitudeInput) {

            latitudeInput.value =
                latitude.toFixed(6);
        }

        if (longitudeInput) {

            longitudeInput.value =
                longitude.toFixed(6);
        }

        if (localityInput) {

            localityInput.value =
                name ||
                localityInput.value ||
                "Selected map location";
        }

        updateSelectedLocationUI(
            latitude,
            longitude,
            name ||
            localityInput?.value ||
            "Selected map location"
        );

        currentLocationLat =
            latitude;

        currentLocationLng =
            longitude;

        console.log(
            "WILDORA LOCATION SAVED:",
            {
                latitude:
                    latitudeInput?.value,

                longitude:
                    longitudeInput?.value,

                locality:
                    localityInput?.value
            }
        );

        return true;
    }


    /* =====================================================
       GET GPS
       ===================================================== */

    function getCurrentPosition() {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                if (
                    !navigator.geolocation
                ) {

                    reject(
                        new Error(
                            "Geolocation is not supported."
                        )
                    );

                    return;
                }

                navigator.geolocation.getCurrentPosition(

                    (position) => {

                        resolve({
                            latitude:
                                position.coords.latitude,

                            longitude:
                                position.coords.longitude,

                            accuracy:
                                position.coords.accuracy
                        });

                    },

                    (error) => {

                        reject(error);
                    },

                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );
            }
        );
    }


    /* =====================================================
       OPEN LOCATION MODAL
       ===================================================== */

    function openLocationModal() {

        if (!locationModal) {
            return;
        }

        locationModal.classList.add("open");

        locationModal.style.display =
            "flex";

        document.body.classList.add(
            "modal-open"
        );

        setTimeout(
            () => {

                initializePickerMap();

                if (pickerMap) {
                    pickerMap.invalidateSize();
                }

                const lat =
                    Number(
                        latitudeInput?.value
                    );

                const lng =
                    Number(
                        longitudeInput?.value
                    );

                if (
                    validCoordinatePair(
                        lat,
                        lng
                    )
                ) {

                    setPickerLocation(
                        lat,
                        lng,
                        localityInput?.value ||
                        "Previously selected location",
                        true
                    );
                }

            },
            150
        );
    }


    function closeLocationModalWindow() {

        if (!locationModal) {
            return;
        }

        locationModal.classList.remove(
            "open"
        );

        locationModal.style.display =
            "none";

        document.body.classList.remove(
            "modal-open"
        );
    }


    if (selectMapLocationBtn) {

        selectMapLocationBtn.addEventListener(
            "click",
            openLocationModal
        );
    }


    if (closeLocationModal) {

        closeLocationModal.addEventListener(
            "click",
            closeLocationModalWindow
        );
    }


    if (cancelLocation) {

        cancelLocation.addEventListener(
            "click",
            closeLocationModalWindow
        );
    }


    if (locationBackdrop) {

        locationBackdrop.addEventListener(
            "click",
            closeLocationModalWindow
        );
    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape"
            ) {

                closeLocationModalWindow();
            }
        }
    );


    /* =====================================================
       PICKER MAP
       ===================================================== */

    function initializePickerMap() {

        if (!locationPickerMapEl) {
            return;
        }

        if (
            typeof L === "undefined"
        ) {

            console.error(
                "Leaflet is not loaded."
            );

            return;
        }

        if (pickerMap) {

            pickerMap.invalidateSize();

            return;
        }

        pickerMap =
            L.map(
                locationPickerMapEl
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
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(pickerMap);


        /* =================================================
           MAP CLICK — FIXED
           ================================================= */

        pickerMap.on(
            "click",
            (event) => {

                const lat =
                    event.latlng.lat;

                const lng =
                    event.latlng.lng;

                /*
                 Update picker display.
                */

                setPickerLocation(
                    lat,
                    lng,
                    "Map selected location",
                    false
                );

                /*
                 IMPORTANT FIX:
                 Immediately write coordinates
                 into the actual observation form.
                */

                writeLocationToForm(
                    lat,
                    lng,
                    "Map selected location"
                );

                console.log(
                    "WILDORA MAP LOCATION SAVED:",
                    {
                        latitude:
                            latitudeInput?.value,

                        longitude:
                            longitudeInput?.value,

                        locality:
                            localityInput?.value
                    }
                );

            }
        );


        addLandmarkMarkers();

        renderLandmarkCards();


        setTimeout(
            () => {

                pickerMap?.invalidateSize();

            },
            300
        );
    }


    /* =====================================================
       SET PICKER LOCATION
       ===================================================== */

    function setPickerLocation(
        lat,
        lng,
        name = "Selected map location",
        center = true
    ) {

        lat = Number(lat);
        lng = Number(lng);

        if (
            !validCoordinatePair(
                lat,
                lng
            )
        ) {

            return;
        }

        pickerLat = lat;
        pickerLng = lng;

        pickerPlaceName =
            name ||
            "Selected map location";


        if (pickerLatitude) {

            pickerLatitude.textContent =
                number(lat);
        }

        if (pickerLongitude) {

            pickerLongitude.textContent =
                number(lng);
        }

        if (pickerLocation) {

            pickerLocation.textContent =
                pickerPlaceName;
        }


        if (
            !pickerMap ||
            typeof L === "undefined"
        ) {

            return;
        }


        if (!pickerSelectedMarker) {

            pickerSelectedMarker =
                L.marker(
                    [
                        lat,
                        lng
                    ],
                    {
                        draggable: true
                    }
                ).addTo(
                    pickerMap
                );


            /* =============================================
               DRAG MARKER — FIXED
               ============================================= */

            pickerSelectedMarker.on(
                "dragend",
                () => {

                    const position =
                        pickerSelectedMarker
                            .getLatLng();


                    setPickerLocation(
                        position.lat,
                        position.lng,
                        "Fine-tuned location",
                        false
                    );


                    /*
                     IMPORTANT FIX:
                     Save dragged coordinates into
                     the actual observation form.
                    */

                    writeLocationToForm(
                        position.lat,
                        position.lng,
                        "Fine-tuned location"
                    );


                    console.log(
                        "WILDORA DRAGGED LOCATION SAVED:",
                        {
                            latitude:
                                latitudeInput?.value,

                            longitude:
                                longitudeInput?.value,

                            locality:
                                localityInput?.value
                        }
                    );

                }
            );

        } else {

            pickerSelectedMarker.setLatLng(
                [
                    lat,
                    lng
                ]
            );
        }


        pickerSelectedMarker.bindPopup(
            `
            <strong>Selected location</strong>
            <br>
            ${number(lat)},
            ${number(lng)}
            <br>
            <small>
                Drag marker to fine-tune.
            </small>
            `
        );


        if (center) {

            pickerMap.setView(
                [
                    lat,
                    lng
                ],
                Math.max(
                    pickerMap.getZoom(),
                    10
                )
            );
        }
    }


    /* =====================================================
       LANDMARK MARKERS
       ===================================================== */

    function addLandmarkMarkers() {

        if (
            !pickerMap ||
            typeof L === "undefined"
        ) {
            return;
        }

        landmarks.forEach(
            (landmark) => {

                const marker =
                    L.marker(
                        [
                            landmark.lat,
                            landmark.lng
                        ]
                    ).addTo(
                        pickerMap
                    );


                marker.bindPopup(
                    `
                    <strong>
                        ${escapeHTML(
                            landmark.name
                        )}
                    </strong>

                    <br>

                    ${escapeHTML(
                        landmark.region
                    )}

                    <br>

                    <small>
                        ${number(
                            landmark.lat
                        )},
                        ${number(
                            landmark.lng
                        )}
                    </small>
                    `
                );


                marker.on(
                    "click",
                    () => {

                        showLandmarkDetail(
                            landmark
                        );

                    }
                );

            }
        );
    }


    /* =====================================================
       LANDMARK CARDS
       ===================================================== */

    function renderLandmarkCards() {

        if (!landmarkGrid) {
            return;
        }

        landmarkGrid.innerHTML =
            landmarks
                .map(
                    (landmark) => {

                        return `
                        <button
                            type="button"
                            class="landmark-card"
                            data-landmark-name="${escapeHTML(
                                landmark.name
                            )}"
                        >

                            <strong>
                                ${escapeHTML(
                                    landmark.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    landmark.region
                                )}
                            </span>

                        </button>
                        `;

                    }
                )
                .join("");


        landmarkGrid
            .querySelectorAll(
                ".landmark-card"
            )
            .forEach(
                (card) => {

                    card.addEventListener(
                        "click",
                        () => {

                            const landmark =
                                landmarks.find(
                                    (item) =>
                                        item.name ===
                                        card.dataset.landmarkName
                                );


                            if (!landmark) {
                                return;
                            }


                            showLandmarkDetail(
                                landmark
                            );


                            if (pickerMap) {

                                pickerMap.setView(
                                    [
                                        landmark.lat,
                                        landmark.lng
                                    ],
                                    11
                                );
                            }

                        }
                    );

                }
            );
    }


    /* =====================================================
       LANDMARK DETAIL
       ===================================================== */

    function showLandmarkDetail(
        landmark
    ) {

        if (!landmarkDetail) {
            return;
        }


        landmarkDetail.innerHTML = `

            <div class="landmark-detail-inner">

                <h4>
                    ${escapeHTML(
                        landmark.name
                    )}
                </h4>


                <p>

                    <strong>
                        Region:
                    </strong>

                    ${escapeHTML(
                        landmark.region
                    )}

                </p>


                <p>

                    <strong>
                        Coordinates:
                    </strong>

                    ${number(
                        landmark.lat
                    )},

                    ${number(
                        landmark.lng
                    )}

                </p>


                <p>

                    <strong>
                        Wildlife:
                    </strong>

                    ${escapeHTML(
                        landmark.animals
                    )}

                </p>


                <button
                    type="button"
                    class="landmark-use-button"
                    id="useLandmarkButton"
                >
                    Use this landmark
                </button>

            </div>

        `;


        const useButton =
            $("useLandmarkButton");


        if (useButton) {

            useButton.addEventListener(
                "click",
                () => {

                    setPickerLocation(
                        landmark.lat,
                        landmark.lng,
                        landmark.name,
                        true
                    );


                    /*
                     Immediately save landmark
                     into observation form.
                    */

                    writeLocationToForm(
                        landmark.lat,
                        landmark.lng,
                        landmark.name
                    );


                    showStatus(
                        `${landmark.name} selected. Click "Use this location" to confirm.`,
                        "success"
                    );

                }
            );

        }

    }


    /* =====================================================
       USE CURRENT GPS FROM MODAL
       ===================================================== */

    if (pickerCurrentLocation) {

        pickerCurrentLocation.addEventListener(
            "click",
            async () => {

                pickerCurrentLocation.disabled =
                    true;

                const oldText =
                    pickerCurrentLocation.textContent;

                pickerCurrentLocation.textContent =
                    "Locating...";


                try {

                    showStatus(
                        "Getting your current location...",
                        "info"
                    );


                    const position =
                        await getCurrentPosition();


                    const lat =
                        Number(
                            position.latitude
                        );

                    const lng =
                        Number(
                            position.longitude
                        );


                    if (
                        !validCoordinatePair(
                            lat,
                            lng
                        )
                    ) {

                        throw new Error(
                            "GPS returned an invalid coordinate."
                        );
                    }


                    setPickerLocation(
                        lat,
                        lng,
                        "Current location",
                        true
                    );


                    writeLocationToForm(
                        lat,
                        lng,
                        "Current location"
                    );


                    showStatus(
                        `✓ Current location saved: ${number(
                            lat
                        )}, ${number(
                            lng
                        )}`,
                        "success"
                    );


                    console.log(
                        "WILDORA GPS SAVED:",
                        {
                            latitude:
                                latitudeInput?.value,

                            longitude:
                                longitudeInput?.value,

                            locality:
                                localityInput?.value
                        }
                    );


                } catch (error) {

                    console.error(
                        "GPS ERROR:",
                        error
                    );


                    let message =
                        "Unable to access your current location.";


                    if (
                        error.code === 1
                    ) {

                        message =
                            "Location permission was denied. Please allow location access.";

                    } else if (
                        error.code === 2
                    ) {

                        message =
                            "Your current location could not be determined.";

                    } else if (
                        error.code === 3
                    ) {

                        message =
                            "Location request timed out.";

                    } else if (
                        error.message
                    ) {

                        message =
                            error.message;
                    }


                    showStatus(
                        message,
                        "error"
                    );

                } finally {

                    pickerCurrentLocation.disabled =
                        false;

                    pickerCurrentLocation.textContent =
                        oldText;
                }

            }
        );
    }


    /* =====================================================
       CONFIRM MAP LOCATION
       ===================================================== */

    if (confirmLocation) {

        confirmLocation.addEventListener(
            "click",
            () => {

                console.log(
                    "WILDORA: Use this location clicked",
                    {
                        pickerLat,
                        pickerLng,
                        pickerPlaceName
                    }
                );


                if (
                    !validCoordinatePair(
                        pickerLat,
                        pickerLng
                    )
                ) {

                    showStatus(
                        "Please click on the map or choose a location first.",
                        "error"
                    );

                    return;
                }


                const saved =
                    writeLocationToForm(
                        pickerLat,
                        pickerLng,
                        pickerPlaceName ||
                        "Selected map location"
                    );


                if (!saved) {

                    showStatus(
                        "Could not save the selected location.",
                        "error"
                    );

                    return;
                }


                console.log(
                    "WILDORA FINAL LOCATION:",
                    {
                        latitude:
                            latitudeInput?.value,

                        longitude:
                            longitudeInput?.value,

                        locality:
                            localityInput?.value
                    }
                );


                closeLocationModalWindow();


                showStatus(
                    `✓ Location saved: ${latitudeInput.value}, ${longitudeInput.value}`,
                    "success"
                );

            }
        );
    }


    /* =====================================================
       TOP-LEVEL USE MY LOCATION
       ===================================================== */

    if (locateBtn) {

        locateBtn.addEventListener(
            "click",
            async () => {

                locateBtn.disabled =
                    true;

                const oldText =
                    locateBtn.textContent;

                locateBtn.textContent =
                    "Locating...";


                try {

                    showStatus(
                        "Getting your current location...",
                        "info"
                    );


                    const position =
                        await getCurrentPosition();


                    const lat =
                        Number(
                            position.latitude
                        );

                    const lng =
                        Number(
                            position.longitude
                        );


                    if (
                        !validCoordinatePair(
                            lat,
                            lng
                        )
                    ) {

                        throw new Error(
                            "GPS returned an invalid coordinate."
                        );
                    }


                    writeLocationToForm(
                        lat,
                        lng,
                        "Current location"
                    );


                    showStatus(
                        `✓ Current location saved: ${number(
                            lat
                        )}, ${number(
                            lng
                        )}`,
                        "success"
                    );


                } catch (error) {

                    console.error(error);


                    showStatus(
                        error.message ||
                        "Unable to access your current location.",
                        "error"
                    );

                } finally {

                    locateBtn.disabled =
                        false;

                    locateBtn.textContent =
                        oldText;
                }

            }
        );
    }


    /* =====================================================
       ATLAS MAP
       ===================================================== */

    function initializeAtlasMap() {

        if (!atlasMapEl) {
            return;
        }

        if (
            typeof L === "undefined"
        ) {

            console.error(
                "Leaflet is not loaded."
            );

            return;
        }

        if (atlasMap) {

            atlasMap.invalidateSize();

            return;
        }


        atlasMap =
            L.map(
                atlasMapEl
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
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(
            atlasMap
        );


        atlasMap.on(
            "click",
            (event) => {

                updateAtlasCurrentLocation(
                    event.latlng.lat,
                    event.latlng.lng,
                    "Atlas map selection"
                );

            }
        );


        setTimeout(
            () => {

                atlasMap?.invalidateSize();

            },
            300
        );

    }


    /* =====================================================
       ATLAS CURRENT LOCATION PANEL
       ===================================================== */

    function ensureAtlasCurrentLocationPanel() {

        if (!atlasMapEl) {
            return null;
        }

        let panel =
            $("atlasCurrentLocation");


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                "div"
            );


        panel.id =
            "atlasCurrentLocation";


        panel.style.cssText =
            `
            margin-top:12px;
            padding:14px;
            border:1px solid rgba(255,255,255,.08);
            border-radius:14px;
            background:rgba(255,255,255,.025);
            `;


        panel.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                flex-wrap:wrap;
            ">

                <div>

                    <small style="
                        display:block;
                        opacity:.6;
                        margin-bottom:4px;
                    ">
                        SELECTED LOCATION
                    </small>

                    <strong
                        id="atlasCurrentName"
                    >
                        No location selected
                    </strong>

                </div>


                <div style="
                    display:flex;
                    gap:18px;
                    flex-wrap:wrap;
                ">

                    <span>
                        Latitude:
                        <strong
                            id="atlasCurrentLat"
                        >
                            —
                        </strong>
                    </span>


                    <span>
                        Longitude:
                        <strong
                            id="atlasCurrentLng"
                        >
                            —
                        </strong>
                    </span>

                </div>

            </div>

        `;


        atlasMapEl.parentNode.insertBefore(
            panel,
            atlasMapEl.nextSibling
        );


        return panel;
    }


    function updateAtlasCurrentLocation(
        lat,
        lng,
        name
    ) {

        if (
            !validCoordinatePair(
                lat,
                lng
            )
        ) {
            return;
        }


        ensureAtlasCurrentLocationPanel();


        const nameEl =
            $("atlasCurrentName");

        const latEl =
            $("atlasCurrentLat");

        const lngEl =
            $("atlasCurrentLng");


        if (nameEl) {

            nameEl.textContent =
                name ||
                "Selected location";
        }


        if (latEl) {

            latEl.textContent =
                number(lat);
        }


        if (lngEl) {

            lngEl.textContent =
                number(lng);
        }


        if (atlasMap) {

            if (!atlasSelectedMarker) {

                atlasSelectedMarker =
                    L.marker(
                        [
                            lat,
                            lng
                        ],
                        {
                            draggable: true
                        }
                    ).addTo(
                        atlasMap
                    );


                atlasSelectedMarker.on(
                    "dragend",
                    () => {

                        const p =
                            atlasSelectedMarker
                                .getLatLng();


                        updateAtlasCurrentLocation(
                            p.lat,
                            p.lng,
                            "Fine-tuned atlas location"
                        );

                    }
                );

            } else {

                atlasSelectedMarker.setLatLng(
                    [
                        lat,
                        lng
                    ]
                );
            }


            atlasSelectedMarker.bindPopup(
                `
                <strong>
                    Selected location
                </strong>
                <br>
                ${number(lat)},
                ${number(lng)}
                `
            );


            atlasSelectedMarker.openPopup();

        }

    }


    /* =====================================================
       NORMALIZE OBSERVATION
       ===================================================== */

    function normalizeObservation(raw) {

        const item = raw || {};

        const analysis =
            safeJSON(
                item.analysis
            );

        const creature =
            safeJSON(
                item.creature
            );


        const rawLat =
            firstValue(
                item.latitude,
                item.lat,
                analysis.latitude
            );


        const rawLng =
            firstValue(
                item.longitude,
                item.lng,
                analysis.longitude
            );


        const parsedLat =
            rawLat === ""
                ? null
                : Number(rawLat);


        const parsedLng =
            rawLng === ""
                ? null
                : Number(rawLng);


        const hasCoordinates =
            validCoordinatePair(
                parsedLat,
                parsedLng
            );


        return {

            raw: item,

            id:
                item.id ||
                "",

            species:
                firstValue(
                    item.species,
                    analysis.species,
                    analysis.common_name,
                    analysis.commonName,
                    creature.name,
                    "Unknown species"
                ),

            scientificName:
                firstValue(
                    item.scientific_name,
                    analysis.scientific_name,
                    analysis.scientificName,
                    creature.scientific_name,
                    ""
                ),

            taxonGroup:
                firstValue(
                    item.taxon_group,
                    analysis.taxon_group,
                    analysis.taxonomic_group,
                    analysis.group,
                    "Wildlife"
                ),

            locality:
                firstValue(
                    item.locality,
                    analysis.locality,
                    hasCoordinates
                        ? "Selected location"
                        : "Location not recorded"
                ),

            latitude:
                hasCoordinates
                    ? parsedLat
                    : null,

            longitude:
                hasCoordinates
                    ? parsedLng
                    : null,

            confidence:
                firstValue(
                    item.confidence,
                    analysis.confidence,
                    ""
                ),

            habitat:
                firstValue(
                    item.habitat,
                    analysis.habitat,
                    analysis.habitat_hint,
                    "Habitat information unavailable."
                ),

            role:
                firstValue(
                    item.role,
                    analysis.role,
                    analysis.ecological_role,
                    "Part of the local ecosystem."
                ),

            quality:
                firstValue(
                    item.quality,
                    analysis.quality,
                    analysis.observation_quality,
                    "Good"
                ),

            fact:
                firstValue(
                    item.fun_fact,
                    analysis.fun_fact,
                    analysis.description,
                    "No additional fact available."
                ),

            safety:
                firstValue(
                    item.safety,
                    analysis.safety_note,
                    "Observe wildlife respectfully and maintain a safe distance."
                ),

            companion:
                creature,

            photo_url:
                firstValue(
                    item.photo_url,
                    ""
                ),

            creature_url:
                firstValue(
                    item.creature_url,
                    ""
                )
        };
    }


    /* =====================================================
       RENDER ATLAS MARKERS
       ===================================================== */

    function renderAtlasMarkers(items) {

        if (
            !atlasMap ||
            typeof L === "undefined"
        ) {
            return;
        }


        atlasMap.eachLayer(
            (layer) => {

                if (
                    layer instanceof L.Marker &&
                    layer !== atlasSelectedMarker
                ) {

                    atlasMap.removeLayer(
                        layer
                    );
                }

            }
        );


        const bounds = [];


        items.forEach(
            (rawItem) => {

                const item =
                    normalizeObservation(
                        rawItem
                    );


                if (
                    item.latitude === null ||
                    item.longitude === null
                ) {
                    return;
                }


                const marker =
                    L.marker(
                        [
                            item.latitude,
                            item.longitude
                        ]
                    ).addTo(
                        atlasMap
                    );


                marker.bindPopup(
                    `
                    <div>

                        <strong>
                            ${escapeHTML(
                                item.species
                            )}
                        </strong>

                        <br>

                        ${escapeHTML(
                            item.locality
                        )}

                        <br>

                        <small>
                            ${number(
                                item.latitude
                            )},
                            ${number(
                                item.longitude
                            )}
                        </small>

                    </div>
                    `
                );


                marker.on(
                    "click",
                    () => {

                        renderAtlasDetail(
                            rawItem
                        );

                    }
                );


                bounds.push(
                    [
                        item.latitude,
                        item.longitude
                    ]
                );

            }
        );


        if (
            bounds.length === 1
        ) {

            atlasMap.setView(
                bounds[0],
                12
            );

        } else if (
            bounds.length > 1
        ) {

            atlasMap.fitBounds(
                bounds,
                {
                    padding:
                        [30, 30]
                }
            );
        }

    }


    /* =====================================================
       ATLAS OBSERVATION LIST
       ===================================================== */

    function renderObservationList(items) {

        if (
            !atlasObservationList
        ) {
            return;
        }


        if (!items.length) {

            atlasObservationList.innerHTML =
                `
                <div class="empty-state">
                    No wildlife observations yet.
                </div>
                `;

            return;
        }


        atlasObservationList.innerHTML =
            items
                .map(
                    (rawItem) => {

                        const item =
                            normalizeObservation(
                                rawItem
                            );


                        const coords =
                            item.latitude !== null
                                ? `${number(
                                    item.latitude
                                )}, ${number(
                                    item.longitude
                                )}`
                                : "Coordinates not recorded";


                        return `

                        <button
                            type="button"
                            class="atlas-observation-card"
                            data-observation-id="${escapeHTML(
                                item.id
                            )}"
                        >

                            ${
                                item.photo_url
                                    ? `
                                    <img
                                        src="${escapeHTML(
                                            item.photo_url
                                        )}"
                                        alt="${escapeHTML(
                                            item.species
                                        )}"
                                    >
                                    `
                                    : `
                                    <div
                                        class="atlas-observation-placeholder"
                                    >
                                        🐾
                                    </div>
                                    `
                            }


                            <div>

                                <strong>
                                    ${escapeHTML(
                                        item.species
                                    )}
                                </strong>


                                <em>
                                    ${escapeHTML(
                                        item.scientificName
                                    )}
                                </em>


                                <span>
                                    📍
                                    ${escapeHTML(
                                        item.locality
                                    )}
                                </span>


                                <small>
                                    🧭
                                    ${escapeHTML(
                                        coords
                                    )}
                                </small>

                            </div>

                        </button>

                        `;

                    }
                )
                .join("");


        atlasObservationList
            .querySelectorAll(
                ".atlas-observation-card"
            )
            .forEach(
                (card) => {

                    card.addEventListener(
                        "click",
                        () => {

                            const id =
                                card.dataset.observationId;


                            const rawItem =
                                observations.find(
                                    (item) =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            id
                                        )
                                );


                            if (!rawItem) {
                                return;
                            }


                            renderAtlasDetail(
                                rawItem
                            );


                            const item =
                                normalizeObservation(
                                    rawItem
                                );


                            if (
                                atlasMap &&
                                item.latitude !== null &&
                                item.longitude !== null
                            ) {

                                atlasMap.setView(
                                    [
                                        item.latitude,
                                        item.longitude
                                    ],
                                    12
                                );
                            }

                        }
                    );

                }
            );

    }


    /* =====================================================
       ATLAS DETAIL
       ===================================================== */

    function renderAtlasDetail(rawItem) {

        const item =
            normalizeObservation(
                rawItem
            );


        if (!atlasDetail) {
            return;
        }


        atlasDetail.style.display =
            "block";


        function setText(
            id,
            value
        ) {

            const element =
                $(id);


            if (element) {

                element.textContent =
                    value ||
                    "—";
            }
        }


        setText(
            "atlasDetailName",
            item.species
        );


        setText(
            "atlasDetailScientific",
            item.scientificName
        );


        setText(
            "atlasDetailCoordinates",
            item.latitude !== null
                ? `${number(
                    item.latitude
                )}, ${number(
                    item.longitude
                )}`
                : "Location not recorded"
        );


        setText(
            "atlasDetailLocation",
            item.locality
        );


        setText(
            "atlasDetailGroup",
            item.taxonGroup
        );


        let confidenceText = "—";


        if (
            item.confidence !== ""
        ) {

            let c =
                Number(
                    item.confidence
                );


            if (
                Number.isFinite(c)
            ) {

                if (c <= 1) {
                    c *= 100;
                }

                confidenceText =
                    `${Math.round(c)}%`;

            } else {

                confidenceText =
                    String(
                        item.confidence
                    );
            }
        }


        setText(
            "atlasDetailConfidence",
            confidenceText
        );


        setText(
            "atlasDetailHabitat",
            item.habitat
        );


        setText(
            "atlasDetailRole",
            item.role
        );


        setText(
            "atlasDetailQuality",
            item.quality
        );


        setText(
            "atlasDetailCompanion",
            item.companion?.name ||
            "Wild Spirit"
        );


        setText(
            "atlasDetailFact",
            item.fact
        );


        setText(
            "atlasDetailSafety",
            item.safety
        );

    }


    /* =====================================================
       TAXON LIST
       ===================================================== */

    function renderTaxonList(items) {

        if (!taxonList) {
            return;
        }


        const counts = {};


        items.forEach(
            (rawItem) => {

                const item =
                    normalizeObservation(
                        rawItem
                    );


                const group =
                    item.taxonGroup ||
                    "Other";


                counts[group] =
                    (
                        counts[group] ||
                        0
                    ) + 1;

            }
        );


        const groups =
            Object.entries(
                counts
            );


        if (!groups.length) {

            taxonList.innerHTML =
                `
                <span class="empty-state">
                    No taxonomic data yet.
                </span>
                `;

            return;
        }


        taxonList.innerHTML =
            groups
                .sort(
                    (a, b) =>
                        b[1] - a[1]
                )
                .map(
                    ([group, count]) => {

                        return `
                        <div class="taxon-item">

                            <span>
                                ${escapeHTML(
                                    group
                                )}
                            </span>

                            <strong>
                                ${count}
                            </strong>

                        </div>
                        `;

                    }
                )
                .join("");
    }


    /* =====================================================
       ATLAS STATISTICS
       ===================================================== */

    function renderAtlasStats(items) {

        const species = new Set();


        items.forEach(
            (rawItem) => {

                const item =
                    normalizeObservation(
                        rawItem
                    );


                if (
                    item.species &&
                    item.species !==
                        "Unknown species"
                ) {

                    species.add(
                        item.species
                    );
                }

            }
        );


        if (atlasSpecies) {

            atlasSpecies.textContent =
                species.size;
        }


        if (statObs) {

            statObs.textContent =
                items.length;
        }


        if (statSpecies) {

            statSpecies.textContent =
                species.size;
        }
    }


    /* =====================================================
       DASHBOARD
       ===================================================== */

    function updateDashboard(stats) {

        if (!stats) {
            return;
        }


        const level =
            firstValue(
                stats.level,
                stats.current_level,
                stats.currentLevel
            );


        const xp =
            firstValue(
                stats.xp,
                stats.total_xp,
                stats.totalXp
            );


        const obs =
            firstValue(
                stats.observations,
                stats.observation_count,
                stats.observationCount
            );


        const species =
            firstValue(
                stats.species,
                stats.species_count,
                stats.speciesCount
            );


        if (
            statLevel &&
            level !== ""
        ) {

            statLevel.textContent =
                level;
        }


        if (
            statXp &&
            xp !== ""
        ) {

            statXp.textContent =
                xp;
        }


        if (
            statObs &&
            obs !== ""
        ) {

            statObs.textContent =
                obs;
        }


        if (
            statSpecies &&
            species !== ""
        ) {

            statSpecies.textContent =
                species;
        }


        const progress =
            Number(
                firstValue(
                    stats.level_progress,
                    stats.levelProgress,
                    stats.progress
                )
            );


        if (
            Number.isFinite(progress)
        ) {

            const safeProgress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );


            if (levelBar) {

                levelBar.style.width =
                    `${safeProgress}%`;
            }


            if (levelPct) {

                levelPct.textContent =
                    `${Math.round(
                        safeProgress
                    )}%`;
            }
        }


        if (
            levelMeta &&
            level !== ""
        ) {

            levelMeta.textContent =
                `Level ${level}`;
        }


        const next =
            firstValue(
                stats.xp_to_next_level,
                stats.xpToNextLevel
            );


        if (
            next !== "" &&
            nextLevelText
        ) {

            nextLevelText.textContent =
                `${next} XP to next level`;
        }


        renderBadges(stats);
    }


    /* =====================================================
       BADGES
       ===================================================== */

    function renderBadges(stats) {

        if (!badgeGrid) {
            return;
        }


        const badges =
            Array.isArray(
                stats?.badges
            )
                ? stats.badges
                : [];


        if (!badges.length) {
            return;
        }


        badgeGrid.innerHTML =
            badges
                .map(
                    (badge) => {

                        return `
                        <div
                            class="badge-card ${
                                badge.unlocked
                                    ? "unlocked"
                                    : "locked"
                            }"
                        >

                            <div
                                class="badge-icon"
                            >
                                ${escapeHTML(
                                    badge.icon ||
                                    "◆"
                                )}
                            </div>


                            <strong>
                                ${escapeHTML(
                                    badge.name ||
                                    "Badge"
                                )}
                            </strong>


                            <p>
                                ${escapeHTML(
                                    badge.description ||
                                    ""
                                )}
                            </p>

                        </div>
                        `;

                    }
                )
                .join("");


        if (badgeCount) {

            badgeCount.textContent =
                badges.filter(
                    (badge) =>
                        badge.unlocked
                ).length;
        }
    }


    /* =====================================================
       COLLECTION
       ===================================================== */

    function renderCollection(items) {

        if (!collectionGrid) {
            return;
        }


        if (!items.length) {

            collectionGrid.innerHTML =
                `
                <div class="empty-state">
                    Your wildlife collection is waiting for its first discovery.
                </div>
                `;

            return;
        }


        collectionGrid.innerHTML =
            items
                .map(
                    (rawItem) => {

                        const item =
                            normalizeObservation(
                                rawItem
                            );


                        return `
                        <article
                            class="collection-card"
                        >

                            <div
                                class="collection-image"
                            >

                                ${
                                    item.photo_url
                                        ? `
                                        <img
                                            src="${escapeHTML(
                                                item.photo_url
                                            )}"
                                            alt="${escapeHTML(
                                                item.species
                                            )}"
                                            loading="lazy"
                                        >
                                        `
                                        : `
                                        <div>
                                            🐾
                                        </div>
                                        `
                                }

                            </div>


                            <div
                                class="collection-content"
                            >

                                <h3>
                                    ${escapeHTML(
                                        item.species
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        item.scientificName
                                    )}
                                </p>


                                <span>
                                    📍
                                    ${escapeHTML(
                                        item.locality
                                    )}
                                </span>

                            </div>

                        </article>
                        `;

                    }
                )
                .join("");
    }


    /* =====================================================
       LOAD OBSERVATIONS
       ===================================================== */

    async function loadObservations() {

        initializeAtlasMap();

        ensureAtlasCurrentLocationPanel();


        try {

            const response =
                await fetch(
                    "/api/observations",
                    {
                        cache: "no-store",

                        headers: {
                            Accept:
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            observations =
                Array.isArray(
                    data.items
                )
                    ? data.items
                    : [];


            renderObservationList(
                observations
            );


            renderAtlasMarkers(
                observations
            );


            renderAtlasStats(
                observations
            );


            renderTaxonList(
                observations
            );


            renderCollection(
                observations
            );


            updateDashboard(
                data.stats
            );


            const firstLocated =
                observations.find(
                    (rawItem) => {

                        const item =
                            normalizeObservation(
                                rawItem
                            );


                        return (
                            item.latitude !== null &&
                            item.longitude !== null
                        );

                    }
                );


            if (firstLocated) {

                renderAtlasDetail(
                    firstLocated
                );
            }


        } catch (error) {

            console.error(
                "Wildora observation loading failed:",
                error
            );


            if (
                atlasObservationList
            ) {

                atlasObservationList.innerHTML =
                    `
                    <div class="empty-state">
                        Could not load wildlife observations.
                    </div>
                    `;
            }
        }
    }


    /* =====================================================
       RESULT
       ===================================================== */

    function renderResult(data) {

        const analysis =
            safeJSON(
                data.analysis
            );


        const creature =
            safeJSON(
                data.creature
            );


        if (result) {

            result.hidden = false;
            result.style.display = "block";
        }


        const species =
            firstValue(
                analysis.common_name,
                analysis.species,
                data.species,
                "Wildlife observation"
            );


        if (resultTitle) {

            resultTitle.textContent =
                species;
        }


        if (realName) {

            realName.textContent =
                species;
        }


        if (latinName) {

            latinName.textContent =
                firstValue(
                    analysis.scientific_name,
                    analysis.scientificName,
                    "Scientific name unavailable"
                );
        }


        if (taxonBadge) {

            taxonBadge.textContent =
                firstValue(
                    analysis.taxon_group,
                    analysis.taxonomic_group,
                    "Wildlife"
                );
        }


        if (confidence) {

            let value =
                Number(
                    analysis.confidence ||
                    0
                );


            if (
                Number.isFinite(value) &&
                value <= 1
            ) {

                value *= 100;
            }


            confidence.textContent =
                `${Math.round(value)}% confidence`;
        }


        if (habitatValue) {

            habitatValue.textContent =
                firstValue(
                    analysis.habitat_hint,
                    analysis.habitat,
                    "Habitat information unavailable."
                );
        }


        if (roleValue) {

            roleValue.textContent =
                firstValue(
                    analysis.ecological_role,
                    analysis.role,
                    "Part of the local ecosystem."
                );
        }


        if (qualityValue) {

            qualityValue.textContent =
                firstValue(
                    analysis.observation_quality,
                    analysis.quality,
                    "Good"
                );
        }


        if (funFact) {

            funFact.textContent =
                firstValue(
                    analysis.fun_fact,
                    analysis.description,
                    "No additional fact available."
                );
        }


        if (safety) {

            safety.textContent =
                firstValue(
                    analysis.safety_note,
                    "Observe wildlife respectfully and maintain a safe distance."
                );
        }


        if (
            realImage &&
            data.photo_url
        ) {

            realImage.src =
                data.photo_url;

            realImage.hidden =
                false;
        }


        if (creatureName) {

            creatureName.textContent =
                firstValue(
                    creature.name,
                    "Wild Spirit"
                );
        }


        if (rarity) {

            rarity.textContent =
                firstValue(
                    creature.rarity,
                    "Rare"
                );
        }


        if (tagline) {

            tagline.textContent =
                firstValue(
                    creature.tagline,
                    "Your discovery has a spirit of its own."
                );
        }


        if (lore) {

            lore.textContent =
                firstValue(
                    creature.lore,
                    "Discover wildlife, understand its world, and unlock a companion inspired by nature."
                );
        }


        if (abilities) {

            const abilityList =
                Array.isArray(
                    creature.abilities
                )
                    ? creature.abilities
                    : [];


            abilities.innerHTML =
                abilityList
                    .map(
                        (ability) =>
                            `
                            <li>
                                ${escapeHTML(
                                    typeof ability === "string"
                                        ? ability
                                        : ability.name ||
                                          ability.description ||
                                          ""
                                )}
                            </li>
                            `
                    )
                    .join("");
        }


        if (
            fantasyVisual &&
            data.creature_url
        ) {

            fantasyVisual.src =
                data.creature_url;

            fantasyVisual.hidden =
                false;
        }


        result.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );
    }


    /* =====================================================
       XP
       ===================================================== */

    function showXP(
        xp,
        levelUp
    ) {

        if (
            xpToast &&
            Number(xp) > 0
        ) {

            xpToast.textContent =
                `+${xp} XP`;


            xpToast.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    xpToast.classList.remove(
                        "show"
                    );

                },
                2500
            );
        }


        if (
            levelUp &&
            xpBurst
        ) {

            xpBurst.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    xpBurst.classList.remove(
                        "show"
                    );

                },
                3000
            );
        }
    }


    /* =====================================================
       FORM SUBMISSION
       ===================================================== */

    if (observeForm) {

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


                /*
                 Read the ACTUAL hidden form
                 fields at submit time.
                */

                const lat =
                    latitudeInput?.value?.trim() ||
                    "";

                const lng =
                    longitudeInput?.value?.trim() ||
                    "";

                const locality =
                    localityInput?.value?.trim() ||
                    "";


                /*
                 Make sure coordinate pair
                 is complete.
                */

                if (
                    (
                        lat !== "" &&
                        lng === ""
                    ) ||
                    (
                        lat === "" &&
                        lng !== ""
                    )
                ) {

                    showStatus(
                        "Please select a complete location.",
                        "error"
                    );

                    return;
                }


                /*
                 Never submit invalid coordinates.
                */

                if (
                    lat !== "" &&
                    lng !== ""
                ) {

                    if (
                        !validCoordinatePair(
                            lat,
                            lng
                        )
                    ) {

                        showStatus(
                            "The selected coordinates are invalid.",
                            "error"
                        );

                        return;
                    }
                }


                const formData =
                    new FormData();


                formData.append(
                    "photo",
                    file
                );


                formData.append(
                    "latitude",
                    lat
                );


                formData.append(
                    "longitude",
                    lng
                );


                formData.append(
                    "locality",
                    locality
                );


                formData.append(
                    "sample_id",
                    observeForm.dataset.sampleId ||
                    ""
                );


                /*
                 DEBUG:
                 Shows EXACTLY what is sent
                 to FastAPI.
                */

                console.log(
                    "WILDORA SUBMIT:",
                    {
                        latitude:
                            formData.get(
                                "latitude"
                            ),

                        longitude:
                            formData.get(
                                "longitude"
                            ),

                        locality:
                            formData.get(
                                "locality"
                            ),

                        sample_id:
                            formData.get(
                                "sample_id"
                            )
                    }
                );


                if (submitBtn) {

                    submitBtn.disabled =
                        true;

                    submitBtn.dataset.originalText =
                        submitBtn.textContent;

                    submitBtn.textContent =
                        "Analyzing...";
                }


                showStatus(
                    "Wildora is studying your observation...",
                    "info"
                );


                try {

                    const response =
                        await fetch(
                            "/api/observe",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    let data;


                    try {

                        data =
                            await response.json();

                    } catch {

                        throw new Error(
                            "The server returned an invalid response."
                        );
                    }


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Observation failed."
                        );
                    }


                    console.log(
                        "WILDORA SERVER RESPONSE:",
                        {
                            latitude:
                                data.latitude,

                            longitude:
                                data.longitude,

                            locality:
                                data.locality
                        }
                    );


                    renderResult(data);


                    updateDashboard(
                        data.stats ||
                        data.progress
                    );


                    showXP(
                        data.xp_gained ||
                        0,
                        data.level_up === true
                    );


                    showStatus(
                        "✓ Observation saved successfully.",
                        "success"
                    );


                    await loadObservations();


                    observeForm.dataset.sampleId =
                        "";


                } catch (error) {

                    console.error(
                        "WILDORA SUBMISSION ERROR:",
                        error
                    );


                    showStatus(
                        error.message ||
                        "Could not save observation.",
                        "error"
                    );


                } finally {

                    if (submitBtn) {

                        submitBtn.disabled =
                            false;

                        submitBtn.textContent =
                            submitBtn.dataset.originalText ||
                            "Identify with AI";
                    }
                }

            }
        );
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    initializeAtlasMap();

    ensureAtlasCurrentLocationPanel();

    loadObservations();

});