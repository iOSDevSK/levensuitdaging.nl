"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
class HelloWorldPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            // Pôvodný príkaz, ktorý vypíše "Hello, World!" ako notifikáciu
            this.addCommand({
                id: "say-hello",
                name: "Say Hello World",
                callback: () => {
                    new obsidian_1.Notice("Hello, World!");
                },
            });
            // Príkaz, ktorý vloží "#Hello World!" do editora
            this.addCommand({
                id: "insert-hello-md",
                name: "Insert Hello World Markdown",
                editorCallback: (editor) => {
                    // Vloží "#Hello World!" do aktuálnej pozície kurzora
                    editor.replaceSelection("# Hello World!");
                    new obsidian_1.Notice("Markdown text bol vložený do editora");
                },
            });
            // Príkaz na nahradenie všetkých výskytov "World" (v akomkoľvek formáte veľkých/malých písmen) za "from Plugin"
            this.addCommand({
                id: "replace-world",
                name: "Replace 'World' with 'from Plugin'",
                editorCallback: (editor) => {
                    // Získa celý text z editora
                    const text = editor.getValue();
                    // Využije regulárny výraz s 'i' flagom pre case-insensitive match (nezáleží na veľkosti písmen)
                    const regex = /world/gi;
                    // Nahradí všetky výskyty a spočíta ich
                    const newText = text.replace(regex, "from Plugin");
                    const replacementCount = (text.match(regex) || []).length;
                    // Nastaví nový text do editora
                    editor.setValue(newText);
                    // Zobrazí notifikáciu s informáciou o počte nahradení
                    new obsidian_1.Notice(`Nahradených ${replacementCount} výskytov slova "World"`);
                },
            });
            // Bonus: Príkaz pre zobrazenie štatistiky textu (počet slov "World")
            this.addCommand({
                id: "count-world",
                name: "Count 'World' Occurrences",
                editorCallback: (editor) => {
                    const text = editor.getValue();
                    const regex = /world/gi;
                    const matches = text.match(regex) || [];
                    new obsidian_1.Notice(`Počet výskytov slova "World": ${matches.length}`);
                },
            });
        });
    }
    onunload() {
        // Čistenie pri vypnutí pluginu (voliteľné)
    }
}
exports.default = HelloWorldPlugin;
