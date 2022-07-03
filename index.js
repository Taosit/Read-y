// Imports the Google Cloud client library
const { pinyin } = require('pinyin-pro');
const hanzi = require("hanzi");
const { jsPDF } = require("jspdf");

const express = require("express");

const port = process.env.PORT || 5000;

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded());

const punctList = [" ", "，", "。", "、", "《", "》", "！", "？", "；", "：", "“", "”", "（", "）", "·", "—"];

const getParseTexts = (text) => {
    const wordlist = hanzi.segment(text);
    return wordlist.map((part) => {
        const type = punctList.includes(part)? "punct" : "word";
        return {value: part, type};
    })
}

hanzi.start();
const doc = new jsPDF();

const getPinyinAndDefinition = (words) => {
    const wordDictionary = {};
    words.forEach(word => {
        if (word.type !== "punct") {
            wordDictionary[word.value] = {
                pinyin: pinyin(word.value, { removeNonZh: true }),
            }
            word.definitions = hanzi.definitionLookup(word.value, "s")
        }
    })
    return wordDictionary;
}

app.get("/languageParser", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})


app.post("/languageParser", async (req, res) => {
    const cappedInput = req.body.input.length > 2000? req.body.input.slice(0, 2000) : req.body.input;
    const wordlist = getParseTexts(cappedInput);
    const pinyinDictionary = getPinyinAndDefinition(wordlist);
    const response = {wordlist, pinyinDictionary}
    res.status(200).json(response);
})

app.post("/languageParser/download", async (req, res) => {
    doc.html(req.body.input).then(() => doc.save('Mandarin-Text.pdf'))
    res.redirect("/languageParser");
})

app.listen(port,() => {
    console.log("connected");
})