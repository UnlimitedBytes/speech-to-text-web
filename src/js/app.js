const startButton = document.getElementById("start-recording");
const textArea = document.getElementById("transcribed-text");
const languageButton = document.getElementById("language-select");
const languageDropdown = document.getElementById("language-dropdown");
const selectedLanguageSpan = document.getElementById("selected-language");
const visualizer = document.getElementById("audioVisualizer");
const visualizerCtx = visualizer.getContext("2d");

const languageSearch = document.getElementById("language-search");
const languageOptions = document.getElementById("language-options");
let commonLanguages = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "fr-FR", name: "French (France)" },
    { code: "de-DE", name: "German (Germany)" },
    { code: "it-IT", name: "Italian (Italy)" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ja-JP", name: "Japanese (Japan)" },
    { code: "ko-KR", name: "Korean (Korea)" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
    { code: "nl-NL", name: "Dutch (Netherlands)" },
    { code: "pl-PL", name: "Polish (Poland)" },
    { code: "ru-RU", name: "Russian (Russia)" },
];

let audioContext;
let analyser;
let microphone;
let animationFrame;

// Initialize speech recognition first
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert("Your browser doesn't support Speech Recognition. Please use Chrome.");
    startButton.disabled = true;
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
let isRecording = false;

function filterLanguages(searchText) {
    return commonLanguages.filter((lang) => lang.name.toLowerCase().includes(searchText.toLowerCase()));
}

function renderLanguageOptions(languages) {
    languageOptions.innerHTML = "";

    languages.forEach((lang, index) => {
        const option = document.createElement("div");
        option.className = "px-4 py-2 text-gray-800 hover:bg-blue-100 cursor-pointer";
        option.textContent = lang.name;
        option.dataset.langCode = lang.code;
        option.setAttribute("role", "option");
        option.setAttribute("tabindex", "-1");
        option.id = `lang-option-${index}`;

        option.addEventListener("click", (e) => selectLanguage(lang, option));
        option.addEventListener("keydown", (e) => handleOptionKeydown(e, lang, option));

        languageOptions.appendChild(option);
    });
}

function populateLanguages() {
    const systemLang = navigator.language || "en-US";
    renderLanguageOptions(commonLanguages);

    // Set initial value
    const defaultLang = commonLanguages.find((l) => l.code.startsWith(systemLang)) || commonLanguages[0];
    selectedLanguageSpan.textContent = defaultLang.name;
    recognition.lang = defaultLang.code;
}

// Add search functionality
languageSearch.addEventListener("input", (e) => {
    const filteredLanguages = filterLanguages(e.target.value);
    renderLanguageOptions(filteredLanguages);
});

// Prevent dropdown close when searching
languageSearch.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Handle search box keyboard events
languageSearch.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            const firstOption = languageOptions.firstElementChild;
            if (firstOption) firstOption.focus();
            break;
        case "Escape":
            e.preventDefault();
            closeDropdown();
            languageButton.focus();
            break;
    }
});

// Fix missing closing bracket in language search keydown handler
languageSearch.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            const firstOption = languageOptions.firstElementChild;
            if (firstOption) firstOption.focus();
            break;
        case "Escape":
            e.preventDefault();
            closeDropdown();
            languageButton.focus();
            break;
    }
});

function selectLanguage(lang, option) {
    selectedLanguageSpan.textContent = lang.name;
    recognition.lang = lang.code;
    closeDropdown();
    languageButton.focus();
}

function handleOptionKeydown(e, lang, option) {
    switch (e.key) {
        case "Enter":
        case " ":
            e.preventDefault();
            selectLanguage(lang, option);
            break;
        case "ArrowDown":
            e.preventDefault();
            const nextOption = option.nextElementSibling;
            if (nextOption) nextOption.focus();
            break;
        case "ArrowUp":
            e.preventDefault();
            const prevOption = option.previousElementSibling;
            if (prevOption) prevOption.focus();
            break;
        case "Escape":
            e.preventDefault();
            closeDropdown();
            languageButton.focus();
            break;
    }
}

function openDropdown() {
    languageDropdown.classList.remove("hidden");
    languageButton.setAttribute("aria-expanded", "true");
    languageSearch.value = ""; // Clear search on open
    languageSearch.focus(); // Focus search input
    renderLanguageOptions(commonLanguages); // Reset options
}

function closeDropdown() {
    languageDropdown.classList.add("hidden");
    languageButton.setAttribute("aria-expanded", "false");
}

// Update language button event listeners
languageButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (languageButton.getAttribute("aria-expanded") === "true") {
        closeDropdown();
    } else {
        openDropdown();
    }
});

languageButton.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "Enter":
        case " ":
        case "ArrowDown":
            e.preventDefault();
            openDropdown();
            break;
        case "Escape":
            e.preventDefault();
            closeDropdown();
            break;
    }
});

// Update click outside handler
document.addEventListener("click", (e) => {
    const isClickInside = languageButton.contains(e.target) || languageDropdown.contains(e.target);
    if (!isClickInside) {
        closeDropdown();
    }
});

// Initialize languages after recognition is set up
populateLanguages();

// Function to initialize audio context
async function setupAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
    } catch (err) {
        console.error("Error accessing microphone:", err);
    }
}

// Add Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`;
    }

    update(amplitude) {
        this.x += this.speedX * amplitude;
        this.y += this.speedY * amplitude;

        // Boundary check and bounce
        if (this.x < 0 || this.x > visualizer.width / 2) this.speedX *= -1;
        if (this.y < 0 || this.y > visualizer.height / 2) this.speedY *= -1;
    }

    draw() {
        visualizerCtx.beginPath();
        visualizerCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        visualizerCtx.fillStyle = this.color;
        visualizerCtx.fill();
    }
}

// Replace existing drawVisualization function
function drawVisualization() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const particles = Array.from({ length: 50 }, () => new Particle(visualizer.width / 4, visualizer.height / 4));

    visualizer.width = visualizer.offsetWidth * 2;
    visualizer.height = visualizer.offsetHeight * 2;
    visualizerCtx.scale(2, 2);

    function draw() {
        animationFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Calculate average amplitude
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const amplitude = average / 128.0;

        // Clear with trail effect
        visualizerCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
        visualizerCtx.fillRect(0, 0, visualizer.width / 2, visualizer.height / 2);

        // Update and draw particles
        particles.forEach((particle) => {
            particle.update(amplitude);
            particle.draw();
        });

        // Draw connecting lines between nearby particles
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach((p2) => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 50) {
                    visualizerCtx.beginPath();
                    visualizerCtx.strokeStyle = `rgba(66, 135, 245, ${0.5 - distance / 100})`;
                    visualizerCtx.lineWidth = 2;
                    visualizerCtx.moveTo(p1.x, p1.y);
                    visualizerCtx.lineTo(p2.x, p2.y);
                    visualizerCtx.stroke();
                }
            });
        });

        // Draw glow effect
        const gradient = visualizerCtx.createRadialGradient(visualizer.width / 4, visualizer.height / 4, 0, visualizer.width / 4, visualizer.height / 4, 100);
        gradient.addColorStop(0, `rgba(66, 135, 245, ${amplitude * 0.2})`);
        gradient.addColorStop(1, "rgba(66, 135, 245, 0)");

        visualizerCtx.fillStyle = gradient;
        visualizerCtx.fillRect(0, 0, visualizer.width / 2, visualizer.height / 2);
    }

    draw();
}

// Update canvas size on window resize
window.addEventListener("resize", () => {
    if (isRecording) {
        visualizer.width = visualizer.offsetWidth * 2;
        visualizer.height = visualizer.offsetHeight * 2;
        visualizerCtx.scale(2, 2);
    }
});

// Add auto-scroll function
function scrollToBottom() {
    textArea.scrollTop = textArea.scrollHeight;
}

// Update recognition.onresult
recognition.onresult = (event) => {
    let finalTranscript = "";
    for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
    }
    textArea.value = finalTranscript;
    // Auto-scroll to bottom
    textArea.scrollTop = textArea.scrollHeight;
};

// Update start button click handler
startButton.addEventListener("click", async () => {
    if (!isRecording) {
        try {
            if (!audioContext) {
                await setupAudioContext();
            } else if (audioContext.state === "suspended") {
                await audioContext.resume();
            }
            recognition.start();
            visualizer.classList.remove("hidden");
            drawVisualization();
            startButton.textContent = "Stop Recording";
            startButton.classList.remove("bg-blue-500", "hover:bg-blue-600");
            startButton.classList.add("bg-red-500", "hover:bg-red-600");
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert("Failed to start recording. Please check your microphone permissions.");
            return;
        }
    } else {
        recognition.stop();
        visualizer.classList.add("hidden");
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        if (audioContext && audioContext.state === "running") {
            await audioContext.suspend();
        }

        // Copy text functionality
        if (textArea.value) {
            textArea.select();
            document.execCommand("copy");
            startButton.textContent = "Copied! Start Recording";
            setTimeout(() => {
                textArea.value = "";
                startButton.textContent = "Start Recording";
            }, 1500);
        } else {
            startButton.textContent = "Start Recording";
        }

        startButton.classList.remove("bg-red-500", "hover:bg-red-600");
        startButton.classList.add("bg-blue-500", "hover:bg-blue-600");
    }
    isRecording = !isRecording;
});

// Enhanced error handling for recognition
recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    startButton.textContent = "Start Recording";
    startButton.classList.remove("bg-red-500", "hover:bg-red-600");
    startButton.classList.add("bg-blue-500", "hover:bg-blue-600");
    visualizer.classList.add("hidden");
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    isRecording = false;
    alert(`Speech recognition error: ${event.error}`);
};
