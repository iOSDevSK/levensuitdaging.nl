import { Plugin, Notice, Editor } from "obsidian";

export default class HelloWorldPlugin extends Plugin {
  async onload() {
    // Pôvodný príkaz, ktorý vypíše "Hello, World!" ako notifikáciu
    this.addCommand({
      id: "say-hello",
      name: "Say Hello World",
      callback: () => {
        new Notice("Hello, World!");
      },
    });

    // Príkaz, ktorý vloží "#Hello World!" do editora
    this.addCommand({
      id: "insert-hello-md",
      name: "Insert Hello World Markdown",
      editorCallback: (editor: Editor) => {
        // Vloží "#Hello World!" do aktuálnej pozície kurzora
        editor.replaceSelection("# Hello World!");
        new Notice("Markdown text bol vložený do editora");
      },
    });

    // Príkaz na nahradenie všetkých výskytov "World" (v akomkoľvek formáte veľkých/malých písmen) za "from Plugin"
    this.addCommand({
      id: "replace-world",
      name: "Replace 'World' with 'from Plugin'",
      editorCallback: (editor: Editor) => {
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
        new Notice(`Nahradených ${replacementCount} výskytov slova "World"`);
      },
    });

    // Bonus: Príkaz pre zobrazenie štatistiky textu (počet slov "World")
    this.addCommand({
      id: "count-world",
      name: "Count 'World' Occurrences",
      editorCallback: (editor: Editor) => {
        const text = editor.getValue();
        const regex = /world/gi;
        const matches = text.match(regex) || [];
        
        new Notice(`Počet výskytov slova "World": ${matches.length}`);
      },
    });
  }

  onunload() {
    // Čistenie pri vypnutí pluginu (voliteľné)
  }
}