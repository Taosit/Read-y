const container = document.querySelector(".container")

const inputContainer = document.querySelector(".input-container");
const outContainer = document.querySelector(".output-container");
const loader = document.querySelector(".loader-container");

const clearAllBtn = document.querySelector("#clear-all-btn");
const viewOriginalBtn = document.querySelector("#view-original-btn");
const userInput = document.querySelector("#input-field");
const wordCountEl = document.querySelector(".count-value");
const submitBtn = document.querySelector("#submit-btn");
const message = document.querySelector(".error-message");
const downloadBtn = document.querySelector("#download-btn");
const pluralEl = document.querySelector(".plural");
const display = document.querySelector("#display-field");
let displayContent = document.querySelector("#display-content")
let definitionEl;

const displayPinyinEl = document.querySelector("#display-pinyin");
const colorCodingEl = document.querySelector("#color-coding");

let inputText = "";
let paragraphs = [];
let dictionary = {};
const backgroundCodes = [1, 2, 3, 4, 0, 1, 2, 3];
let lastBackgroundCode = 0;

function showLoadingSpinner() {
    loader.classList.replace("none-display", "flex-display-column");
    inputContainer.hidden = true;
    container.style.display = "none"
}

function removeLoadingSpinner() {
    loader.classList.replace("flex-display-column", "none-display");
    container.style.display = "grid"
    outContainer.classList.replace("none-display", "flex-display-column");
    submitBtn.hidden = true;
    downloadBtn.classList.replace("none-display", "flex-display-row");
}

function switchToOutputUI() {
    inputContainer.hidden = true;
    outContainer.classList.replace("none-display", "flex-display-column");
    submitBtn.hidden = true;
    downloadBtn.classList.replace("none-display", "flex-display-row");
}

function switchToInputUI() {
    inputContainer.hidden = false;
    outContainer.classList.replace("flex-display-column", "none-display");
    submitBtn.hidden = false;
    downloadBtn.classList.replace("flex-display-row", "none-display");
}

function generateRandomBackground() {
    const randomOffset = Math.floor(Math.random()*4);
    const background = backgroundCodes[lastBackgroundCode + randomOffset];
    lastBackgroundCode = background;
    return background;
}

function deleteDefinitions(definition) {
    if (definition.parentElement.classList.contains("word-container")) {
        definition.parentElement.remove();
    } else {
        definition.remove();
    }
}

function createDefinitionItem(def, span) {
    const definitionItem = document.createElement("div");
    definitionItem.classList.add("definition-item-div");
    const definitionTerm = document.createElement("span");
    definitionTerm.textContent = `${def.replace(def[0], def[0].toUpperCase())} `;
    const icon = document.createElement("span");
    icon.textContent = "+";
    icon.classList.add("icon");
    icon.addEventListener("click", () => {
        if (!span.parentElement.classList.contains("word-container")) {
            if (span.nextElementSibling?.classList.contains("definition-term")) {
                span.nextElementSibling.textContent =
                    `${span.nextElementSibling.textContent.slice(0, -1)}, ${def})`;
            } else {
                const displayedDefTerm = document.createElement("span");
                displayedDefTerm.classList.add("definition-term");
                displayedDefTerm.addEventListener("click", () => deleteDefinitions(displayedDefTerm));
                displayedDefTerm.textContent = `(${def})`;
                span.parentNode.insertBefore(displayedDefTerm, span.nextSibling);
            }
        } else {
            const displayedDefTerm = document.createElement("span");
            displayedDefTerm.classList.add("definition-term");
            displayedDefTerm.addEventListener("click", () => deleteDefinitions(displayedDefTerm));
            const [ , textSpan] = Array.from(span.parentElement.nextElementSibling.children);
            if (textSpan.classList.contains("definition-term")) {
                span.parentElement.nextElementSibling.remove();
                displayedDefTerm.textContent =
                    `${textSpan.textContent.slice(0, -1)}, ${def})`;
            } else {
                displayedDefTerm.textContent = `(${def})`;
            }
            const NewPinyinSpan = createPinyinSpan({value: displayedDefTerm.textContent});
            const wordSpanContainer = createWordContainer(displayedDefTerm, NewPinyinSpan);
            span.parentNode.parentNode.insertBefore(wordSpanContainer, span.parentNode.nextSibling);
        }
    })
    definitionItem.append(definitionTerm, icon);
    return definitionItem;
}

function createPopupDiv(span, word) {
    const popupDiv = document.createElement("div");
    popupDiv.classList.add("definition-div");
    popupDiv.style.position = "absolute";
    const posX = Math.min(span.getBoundingClientRect().left + span.offsetWidth + 3, window.innerWidth - 175)
    popupDiv.style.left = `${posX}px`
    const posY = Math.min(span.getBoundingClientRect().top + 25, window.innerHeight - 230)
    popupDiv.style.top = `${posY}px`
    popupDiv.style.transform = `translateY(${-popupDiv.offsetHeight})`;
    const wordHeader = document.createElement("h4");
    wordHeader.classList.add("word-header");
    wordHeader.textContent = word.value;
    const definitionList = document.createElement("div");
    let definitionItems = [];
    if (!word.definitions) {
        definitionItems.push("(No Definition Available)");
    } else {
        word.definitions.forEach((entry) => {
            entry.definition.split("/").forEach((def) => {
                const definitionItem = createDefinitionItem(def, span);
                definitionItems.push(definitionItem);
            })
        })
    }
    definitionList.append(...definitionItems);
    popupDiv.append(wordHeader, definitionList);
    return popupDiv;
}

function createWordSpan(word, count) {
    const span = document.createElement("span");
    span.textContent = word.value;
    span.classList.add("word-span");
    span.classList.add("no-background-span");
    span.setAttribute("id", count);
    span.addEventListener("click", () => {
        const popupDiv = createPopupDiv(span, word);
        definitionEl = popupDiv;
        document.querySelector("body").appendChild(popupDiv);
    })
    return span;
}

function createPunctSpan(punct) {
    const span = document.createElement("div");
    span.classList.add("punct-span");
    span.textContent = punct;
    return span;
}

function createPinyinSpan(word) {
    const span = document.createElement("span");
    span.classList.add("pinyin-span");
    span.textContent = dictionary[word]?.pinyin || " ";
    return span;
}

function createWordContainer(wordSpan, pinyinSpan) {
    const span = document.createElement("span");
    span.classList.add("word-container");
    span.appendChild(pinyinSpan);
    span.appendChild(wordSpan);
    return span;
}

function addPinyin(paragraphDiv) {
    const currentSpans = Array.from(paragraphDiv.children);
    paragraphDiv.textContent = "";
    const newWordContainers = currentSpans.map((span) => {
        let pinyinSpan;
        if (span.classList.contains("definition-term")) {
            pinyinSpan = createPinyinSpan({value: span.textContent});
        } else {
            pinyinSpan = createPinyinSpan(span.innerHTML);
        }
        return createWordContainer(span, pinyinSpan);
    })
    paragraphDiv.append(...newWordContainers);
}

function removePinyin(paragraphDiv) {
    const currentContainers = Array.from(paragraphDiv.children);
    paragraphDiv.textContent = "";
    const newSpans = currentContainers.map((wordContainer) => {
        return wordContainer.children[1];
    })
    paragraphDiv.append(...newSpans);
    return paragraphDiv;
}

function addBackground(paragraphDiv) {
    const currentSpans = Array.from(paragraphDiv.children);
    paragraphDiv.textContent = "";
    let newElements;
    if (!currentSpans[0].classList.contains("word-container")) {
        newElements = currentSpans.map((wordSpan) => {
            if (wordSpan.classList.contains("word-span")) {
                wordSpan.classList.replace("no-background-span",
                    `background${generateRandomBackground()}-span`);

            }
            return wordSpan;
        })
    } else {
        newElements = currentSpans.map((wordContainer) => {
            if (wordContainer.children[1].classList.contains("word-span")) {
                wordContainer.children[1].classList.replace("no-background-span",
                    `background${generateRandomBackground()}-span`);
                return createWordContainer(wordContainer.lastElementChild, wordContainer.firstElementChild);
            }
            return wordContainer;
        })
    }
    paragraphDiv.append(...newElements);
}

function removeBackground(paragraphDiv) {
    const currentElements = Array.from(paragraphDiv.children);
    paragraphDiv.textContent = "";
    let newElements;
    if (!currentElements[0].classList.contains("word-container")) {
        newElements = currentElements.map((wordSpan) => {
            if (wordSpan.classList.contains("word-span")) {
                [0, 1, 2, 3, 4].forEach(n => {
                    wordSpan.classList.remove(`background${n}-span`);
                })
                wordSpan.classList.add("no-background-span");
            }
            return wordSpan;
        })
    } else {
        newElements = currentElements.map((wordContainer) => {
            if (wordContainer.children[1].classList.contains("word-span")) {
                [0, 1, 2, 3, 4].forEach(n => {
                    wordContainer.children[1].classList.remove(`background${n}-span`);
                })
                wordContainer.children[1].classList.add("no-background-span");
                const [pinyinSpan, wordSpan] = Array.from(wordContainer.children)
                return createWordContainer(wordSpan, pinyinSpan);
            }
            return wordContainer;
        })
    }
    paragraphDiv.append(...newElements);
}

function createParagraphUI(paragraph, paragraphDiv) {
    let count = 0;
    paragraph.forEach((word) => {
        if (word.type === "word") {
            const wordSpan = createWordSpan(word, count);
            paragraphDiv.appendChild(wordSpan);
        } else {
            const punctSpan = createPunctSpan(word.value);
            paragraphDiv.appendChild(punctSpan);
        }
    })
    return paragraphDiv;
}

async function createParagraph(paragraph) {
    if (paragraph.length !== 0) {
        let paragraphDiv = document.createElement("div");
        paragraphDiv.classList.add("paragraph-div");
        const processedParagraph = await submitUserInput(paragraph);
        paragraphs.push(processedParagraph);
        return createParagraphUI(processedParagraph, paragraphDiv);
    }
}

async function submitUserInput(userInput) {
    const baseServerUrl = "https://read-y.herokuapp.com";
    const inputJson = {
        input: userInput
    }
    const params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputJson)
    }
    const res = await fetch(`${baseServerUrl}/languageParser`, params);
    const {wordlist, pinyinDictionary} = await res.json();
    dictionary = {...dictionary, ...pinyinDictionary};
    return wordlist;
}

submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (userInput.value.length === 0) return;
    if (userInput.value !== inputText) {
        showLoadingSpinner()
        displayPinyinEl.checked = false;
        colorCodingEl.checked = false;
        inputText = userInput.value;
        paragraphs = []
        display.textContent = "";
        displayContent.textContent = "";
        const promiseArray = userInput.value.split("\n").filter(paragraph => paragraph.length > 0)
          .map(paragraph => createParagraph(paragraph))

        Promise.all(promiseArray).then((paragraphDivs) => {
            displayContent.append(...paragraphDivs);
            display.appendChild(displayContent)
            removeLoadingSpinner();
        })
    } else {
        switchToOutputUI();
    }
})

viewOriginalBtn.addEventListener("click", (e) => {
    e.preventDefault();
    switchToInputUI();
})

const showErrorMessage = () => {
    message.classList.replace("hide-error-message", "show-error-message")
    setTimeout(() => {
        message.classList.replace("show-error-message", "hide-error-message")
    }, 3000)
}

userInput.addEventListener("input", (e) => {
    let {value} = e.target;
    if (value.length === 0) {
        wordCountEl.textContent = "0";
        pluralEl.hidden = true;
    } else {
        wordCountEl.textContent = value.length;
        pluralEl.hidden = false;
        if (value.length > 2000) {
            showErrorMessage()
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
        }
    }
})

clearAllBtn.addEventListener("click", (e) => {
    e.preventDefault()
    userInput.value = "";
    wordCountEl.textContent = "0";
})

displayPinyinEl.addEventListener("click", () => {
    if (displayPinyinEl.checked) {
        Array.from(displayContent.children).forEach((paragraphDiv, index) => {
            addPinyin(paragraphDiv, index)
        });
    } else {
        Array.from(displayContent.children).forEach(paragraphDiv => removePinyin(paragraphDiv));
    }
});

colorCodingEl.addEventListener("click", () => {
    if (colorCodingEl.checked) {
        Array.from(displayContent.children).forEach(paragraphDiv => addBackground(paragraphDiv));
    } else {
        Array.from(displayContent.children).forEach(paragraphDiv => removeBackground(paragraphDiv));
    }
})

downloadBtn.addEventListener("click", createPDFfromHTML);

function createPDFfromHTML() {
    const opt = {
        pagebreak: {avoid: "span"},
        margin:       1,
        filename:     'myfile.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(displayContent).save();
}

window.addEventListener('mouseup', function(event){
    if (definitionEl && event.target !== definitionEl && event.target.parentNode !== definitionEl
        && event.target.parentNode.parentNode !== definitionEl && event.target.parentNode.parentNode?.parentNode !== definitionEl){
        definitionEl.remove();
    }
});
