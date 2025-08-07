
## Základná štruktúra Johnny Decimal

1. Oblasti (10-19,20-29,...,atď) - Hlavné rozdelenie informácií na veľké kategórie
2. Kategórie (11,12,13,.... v rámci oblst 10-19) - Podskupiny v každej oblasti
3. ID čísla (11.01, 11.02) - Konkrétne položky v kategóriách

## Ako začať  s poznámkami ?

1. Identifikovať hlavné oblasti (napr. Osobné 10-19, Práca 20-29, Štúdium 30-39)
2. Vytvoriť kategórie v rámci oblasti (napr. v oblasti Osobné 10-19 : 11  -  Finance, 12 - Zdravie, 13-Koníčky)
3. Pridať ID ku konkrétnym položkám (napr. 11.01 Rozpočet, 11.02 Úspory, 11.03 Investície)
4. Vytvoriť register pre udržanie všetkých čísel
5. Postupné pridávanie poznámok do oblastí

***Pri vytváraní názvu súborom používať fotmát typu "11.02 Názvov poznámky"

Číslo na začiatku nám zjednoduší vyhľadávanie a triedenie

## Základné princípy Johnny Decimal

1. Princíp nikdy viac ako 10 t.j. napr. max 11.01 - 11.10 
2. Jedinečné ID čísla - každé Johnny Decimal číslo by malo byť jedinečném apr. 12.04 a malo by odkazovať iba na 1 vec
3. Oblasť 00 - vyhradená pre indexy napr. 10.00, 20.00 alebo prehľady, napr. môže ísť o súhrnný dokument
4. Pravidelne systém reogranizovať