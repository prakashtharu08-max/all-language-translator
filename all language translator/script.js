const fromText = document.querySelector(".from-text");
const toText = document.querySelector(".to-text");
const exchangeIcon = document.querySelector(".exchange");
const selectTags = document.querySelectorAll("select");
const icons = document.querySelectorAll(".row i");
const translateBtn = document.querySelector(".translate-btn");

// Populate select elements with countries
selectTags.forEach((tag, id) => {
    for (let country_code in countries) {
        let selected = id == 0 ? country_code == "en-GB" ? "selected" : "" : country_code == "es-ES" ? "selected" : "";
        let option = `<option ${selected} value="${country_code}">${countries[country_code]}</option>`;
        tag.insertAdjacentHTML("beforeend", option);
    }
});

// Exchange text and languages
exchangeIcon.addEventListener("click", () => {
    let tempText = fromText.value;
    let tempLang = selectTags[0].value;
    
    fromText.value = toText.value;
    toText.value = tempText;
    
    selectTags[0].value = selectTags[1].value;
    selectTags[1].value = tempLang;
});

// Real-time update handling when text gets empty
fromText.addEventListener("keyup", () => {
    if(!fromText.value) {
        toText.value = "";
    }
});

// Translation API Call
translateBtn.addEventListener("click", () => {
    let text = fromText.value.trim();
    let translateFrom = selectTags[0].value;
    let translateTo = selectTags[1].value;
    
    if(!text) return;
    
    toText.setAttribute("placeholder", "Translating...");
    
    let apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${translateFrom}&tl=${translateTo}&dt=t&q=${encodeURIComponent(text)}`;
    
    fetch(apiUrl).then(res => res.json()).then(data => {
        let translatedText = "";
        data[0].forEach(item => {
            if (item[0]) translatedText += item[0];
        });
        toText.value = translatedText;
        toText.setAttribute("placeholder", "Translation");
    }).catch(() => {
        toText.setAttribute("placeholder", "Something went wrong.");
    });
});

// Handing Icons (Copy and Text to Speech)
icons.forEach(icon => {
    icon.addEventListener("click", ({target}) => {
        if(!fromText.value || !toText.value) return;
        
        if(target.classList.contains("fa-copy")) {
            if(target.id == "from") {
                navigator.clipboard.writeText(fromText.value);
            } else {
                navigator.clipboard.writeText(toText.value);
            }
        } else {
            let utterance;
            if(target.id == "from") {
                utterance = new SpeechSynthesisUtterance(fromText.value);
                utterance.lang = selectTags[0].value;
            } else {
                utterance = new SpeechSynthesisUtterance(toText.value);
                utterance.lang = selectTags[1].value;
            }
            speechSynthesis.speak(utterance);
        }
    });
});
