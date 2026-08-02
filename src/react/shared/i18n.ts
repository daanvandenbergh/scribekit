/**
 * The built-in UI copy for the blog and docs components (search placeholder, "load more",
 * "min read", the docs feedback widget, ...), translated into the EU's 24 official languages.
 *
 * The i18n engine is `@daanvandenbergh/i18nkit`: {@link ui} is a fixed {@link I18n} instance over
 * those 24 languages, {@link CATALOG} is authored through its `defineTextCatalog` (so a missing
 * translation is a compile error, by construction), and {@link blogLabels}/{@link docsLabels}
 * resolve the copy for a given language via a bound translator. The catalog covers every language
 * so the components can render their copy in whatever language a consumer's blog is published in;
 * each label also stays overridable via the components' label props.
 *
 * This file is deliberately free of any `react`, `next/*`, or `server-only` import (i18nkit's core
 * is framework-free) so it can be pulled into both the server components (`BlogPage`,
 * `BlogOverview`, `DocsPage`) and the client ones (`BlogOverviewGrid`, the docs search/sidebar).
 */

import { I18n } from "@daanvandenbergh/i18nkit";

/**
 * The fixed i18n instance backing the components' built-in copy: the EU's 24 official languages,
 * keyed by their primary BCP 47 subtag, with `en` as the fallback. Adding a code here turns every
 * {@link CATALOG} entry still missing that language into a compile error. The `label` endonyms are
 * carried because i18nkit requires one per locale; the components never render a picker from this
 * instance, so they are not otherwise used.
 */
export const ui = new I18n({
    locales: {
        en: { label: "English" },
        fr: { label: "Français" },
        de: { label: "Deutsch" },
        es: { label: "Español" },
        it: { label: "Italiano" },
        pt: { label: "Português" },
        nl: { label: "Nederlands" },
        pl: { label: "Polski" },
        ro: { label: "Română" },
        el: { label: "Ελληνικά" },
        sv: { label: "Svenska" },
        da: { label: "Dansk" },
        fi: { label: "Suomi" },
        cs: { label: "Čeština" },
        sk: { label: "Slovenčina" },
        hu: { label: "Magyar" },
        bg: { label: "Български" },
        hr: { label: "Hrvatski" },
        sl: { label: "Slovenščina" },
        et: { label: "Eesti" },
        lv: { label: "Latviešu" },
        lt: { label: "Lietuvių" },
        ga: { label: "Gaeilge" },
        mt: { label: "Malti" },
    },
    default: "en",
});

/**
 * A language {@link CATALOG} carries copy for, i.e. one of {@link ui}'s locale codes. Add a locale
 * to `ui` to introduce a language; TypeScript then flags every catalog entry that lacks it.
 */
export type Language = keyof typeof ui.locales;

/**
 * Narrow a blog's free-form `lang` (a `LocaleConfig.code` such as `"fr"` or `"pt-BR"`) to a
 * {@link Language}, matching on the primary subtag so regional variants resolve to their base
 * language. Falls back to `ui.default` (`"en"`) when the value is missing or unsupported.
 *
 * @param raw - the blog's language code, or undefined.
 * @returns a guaranteed-valid {@link Language}.
 */
export function resolveLanguage(raw: string | undefined): Language {
    return ui.resolveLocale((raw ?? "").toLowerCase().split("-")[0]);
}

/**
 * Every piece of built-in UI copy the blog and docs components render, translated into all of
 * {@link ui}'s languages. Authored through {@link ui}'s `defineTextCatalog`, which forces full
 * per-language coverage (a missing translation is a compile error) while preserving each entry's
 * literal type - so a bound translator can infer each parameterized entry's arguments. `back`
 * keeps the universally-understood word "Blog".
 */
export const CATALOG = ui.defineTextCatalog({
    empty: {
        en: "No posts yet - check back soon.",
        fr: "Aucun article pour le moment - revenez bientôt.",
        de: "Noch keine Beiträge - schauen Sie bald wieder vorbei.",
        es: "Aún no hay publicaciones - vuelve pronto.",
        it: "Ancora nessun articolo - torna presto.",
        pt: "Ainda não há artigos - volte em breve.",
        nl: "Nog geen berichten - kom binnenkort terug.",
        pl: "Nie ma jeszcze wpisów - zajrzyj wkrótce.",
        ro: "Încă nu există articole - reveniți în curând.",
        el: "Δεν υπάρχουν ακόμη αναρτήσεις - ελάτε ξανά σύντομα.",
        sv: "Inga inlägg ännu - kom tillbaka snart.",
        da: "Ingen indlæg endnu - kig forbi snart.",
        fi: "Ei vielä julkaisuja - palaa pian.",
        cs: "Zatím žádné příspěvky - podívejte se brzy znovu.",
        sk: "Zatiaľ žiadne príspevky - pozrite sa čoskoro znova.",
        hu: "Még nincsenek bejegyzések - nézzen vissza hamarosan.",
        bg: "Все още няма публикации - върнете се скоро.",
        hr: "Još nema objava - vratite se uskoro.",
        sl: "Še ni objav - vrnite se kmalu.",
        et: "Postitusi veel pole - vaadake varsti uuesti.",
        lv: "Vēl nav ierakstu - apmeklējiet vēlreiz drīzumā.",
        lt: "Kol kas įrašų nėra - užsukite netrukus.",
        ga: "Níl aon phost fós - seiceáil ar ais go luath.",
        mt: "Għad m'hemm l-ebda post - erġa' ċċekkja dalwaqt.",
    },
    readMore: {
        en: "Read more →",
        fr: "Lire la suite →",
        de: "Weiterlesen →",
        es: "Leer más →",
        it: "Leggi di più →",
        pt: "Ler mais →",
        nl: "Lees meer →",
        pl: "Czytaj więcej →",
        ro: "Citește mai mult →",
        el: "Διαβάστε περισσότερα →",
        sv: "Läs mer →",
        da: "Læs mere →",
        fi: "Lue lisää →",
        cs: "Číst více →",
        sk: "Čítať viac →",
        hu: "Tovább →",
        bg: "Прочетете повече →",
        hr: "Pročitaj više →",
        sl: "Preberi več →",
        et: "Loe edasi →",
        lv: "Lasīt vairāk →",
        lt: "Skaityti daugiau →",
        ga: "Léigh tuilleadh →",
        mt: "Aqra aktar →",
    },
    searchPlaceholder: {
        en: "Search posts…",
        fr: "Rechercher des articles…",
        de: "Beiträge suchen…",
        es: "Buscar publicaciones…",
        it: "Cerca articoli…",
        pt: "Pesquisar artigos…",
        nl: "Berichten zoeken…",
        pl: "Szukaj wpisów…",
        ro: "Caută articole…",
        el: "Αναζήτηση αναρτήσεων…",
        sv: "Sök inlägg…",
        da: "Søg indlæg…",
        fi: "Hae julkaisuja…",
        cs: "Hledat příspěvky…",
        sk: "Hľadať príspevky…",
        hu: "Bejegyzések keresése…",
        bg: "Търсене на публикации…",
        hr: "Pretraži objave…",
        sl: "Iskanje objav…",
        et: "Otsi postitusi…",
        lv: "Meklēt ierakstus…",
        lt: "Ieškoti įrašų…",
        ga: "Cuardaigh postálacha…",
        mt: "Fittex il-posts…",
    },
    loadMore: {
        en: "Load more",
        fr: "Charger plus",
        de: "Mehr laden",
        es: "Cargar más",
        it: "Carica altro",
        pt: "Carregar mais",
        nl: "Meer laden",
        pl: "Załaduj więcej",
        ro: "Încarcă mai mult",
        el: "Φόρτωση περισσότερων",
        sv: "Ladda fler",
        da: "Indlæs flere",
        fi: "Lataa lisää",
        cs: "Načíst více",
        sk: "Načítať viac",
        hu: "Több betöltése",
        bg: "Зареди още",
        hr: "Učitaj više",
        sl: "Naloži več",
        et: "Laadi rohkem",
        lv: "Ielādēt vairāk",
        lt: "Įkelti daugiau",
        ga: "Lódáil tuilleadh",
        mt: "Għabbi aktar",
    },
    allCategories: {
        en: "All",
        fr: "Tous",
        de: "Alle",
        es: "Todos",
        it: "Tutti",
        pt: "Todos",
        nl: "Alle",
        pl: "Wszystkie",
        ro: "Toate",
        el: "Όλα",
        sv: "Alla",
        da: "Alle",
        fi: "Kaikki",
        cs: "Vše",
        sk: "Všetko",
        hu: "Összes",
        bg: "Всички",
        hr: "Sve",
        sl: "Vse",
        et: "Kõik",
        lv: "Visi",
        lt: "Visi",
        ga: "Gach",
        mt: "Kollha",
    },
    back: ui.uniform("← Blog"),
    onThisPage: {
        en: "On this page",
        fr: "Sur cette page",
        de: "Auf dieser Seite",
        es: "En esta página",
        it: "In questa pagina",
        pt: "Nesta página",
        nl: "Op deze pagina",
        pl: "Na tej stronie",
        ro: "Pe această pagină",
        el: "Σε αυτή τη σελίδα",
        sv: "På den här sidan",
        da: "På denne side",
        fi: "Tällä sivulla",
        cs: "Na této stránce",
        sk: "Na tejto stránke",
        hu: "Ezen az oldalon",
        bg: "На тази страница",
        hr: "Na ovoj stranici",
        sl: "Na tej strani",
        et: "Sellel lehel",
        lv: "Šajā lapā",
        lt: "Šiame puslapyje",
        ga: "Ar an leathanach seo",
        mt: "F'din il-paġna",
    },
    similarPages: {
        en: "Similar pages",
        fr: "Pages similaires",
        de: "Ähnliche Seiten",
        es: "Páginas similares",
        it: "Pagine simili",
        pt: "Páginas semelhantes",
        nl: "Vergelijkbare pagina's",
        pl: "Podobne strony",
        ro: "Pagini similare",
        el: "Παρόμοιες σελίδες",
        sv: "Liknande sidor",
        da: "Lignende sider",
        fi: "Samankaltaisia sivuja",
        cs: "Podobné stránky",
        sk: "Podobné stránky",
        hu: "Hasonló oldalak",
        bg: "Подобни страници",
        hr: "Slične stranice",
        sl: "Podobne strani",
        et: "Sarnased lehed",
        lv: "Līdzīgas lapas",
        lt: "Panašūs puslapiai",
        ga: "Leathanaigh chosúla",
        mt: "Paġni simili",
    },
    filterByCategory: {
        en: "Filter by category",
        fr: "Filtrer par catégorie",
        de: "Nach Kategorie filtern",
        es: "Filtrar por categoría",
        it: "Filtra per categoria",
        pt: "Filtrar por categoria",
        nl: "Filteren op categorie",
        pl: "Filtruj według kategorii",
        ro: "Filtrează după categorie",
        el: "Φιλτράρισμα ανά κατηγορία",
        sv: "Filtrera efter kategori",
        da: "Filtrer efter kategori",
        fi: "Suodata luokan mukaan",
        cs: "Filtrovat podle kategorie",
        sk: "Filtrovať podľa kategórie",
        hu: "Szűrés kategória szerint",
        bg: "Филтриране по категория",
        hr: "Filtriraj po kategoriji",
        sl: "Filtriraj po kategoriji",
        et: "Filtreeri kategooria järgi",
        lv: "Filtrēt pēc kategorijas",
        lt: "Filtruoti pagal kategoriją",
        ga: "Scag de réir catagóire",
        mt: "Iffiltra skont il-kategorija",
    },
    writtenBy: {
        en: "Written by",
        fr: "Écrit par",
        de: "Geschrieben von",
        es: "Escrito por",
        it: "Scritto da",
        pt: "Escrito por",
        nl: "Geschreven door",
        pl: "Napisane przez",
        ro: "Scris de",
        el: "Γράφτηκε από",
        sv: "Skriven av",
        da: "Skrevet af",
        fi: "Kirjoittanut",
        cs: "Autor",
        sk: "Autor",
        hu: "Írta",
        bg: "Написано от",
        hr: "Autor",
        sl: "Avtor",
        et: "Kirjutanud",
        lv: "Autors",
        lt: "Parašė",
        ga: "Scríofa ag",
        mt: "Miktub minn",
    },
    publishedOn: {
        en: (d: string) => `Published ${d}`,
        fr: (d: string) => `Publié le ${d}`,
        de: (d: string) => `Veröffentlicht am ${d}`,
        es: (d: string) => `Publicado el ${d}`,
        it: (d: string) => `Pubblicato il ${d}`,
        pt: (d: string) => `Publicado em ${d}`,
        nl: (d: string) => `Gepubliceerd op ${d}`,
        pl: (d: string) => `Opublikowano ${d}`,
        ro: (d: string) => `Publicat pe ${d}`,
        el: (d: string) => `Δημοσιεύτηκε στις ${d}`,
        sv: (d: string) => `Publicerad ${d}`,
        da: (d: string) => `Udgivet ${d}`,
        fi: (d: string) => `Julkaistu ${d}`,
        cs: (d: string) => `Publikováno ${d}`,
        sk: (d: string) => `Publikované ${d}`,
        hu: (d: string) => `Közzétéve: ${d}`,
        bg: (d: string) => `Публикувано на ${d}`,
        hr: (d: string) => `Objavljeno ${d}`,
        sl: (d: string) => `Objavljeno ${d}`,
        et: (d: string) => `Avaldatud ${d}`,
        lv: (d: string) => `Publicēts ${d}`,
        lt: (d: string) => `Paskelbta ${d}`,
        ga: (d: string) => `Foilsithe ${d}`,
        mt: (d: string) => `Ippubblikat ${d}`,
    },
    readingTime: {
        en: (m: number) => `${m} min read`,
        fr: (m: number) => `${m} min de lecture`,
        de: (m: number) => `${m} Min. Lesezeit`,
        es: (m: number) => `${m} min de lectura`,
        it: (m: number) => `${m} min di lettura`,
        pt: (m: number) => `${m} min de leitura`,
        nl: (m: number) => `${m} min leestijd`,
        pl: (m: number) => `${m} min czytania`,
        ro: (m: number) => `${m} min de citit`,
        el: (m: number) => `${m} λεπτά ανάγνωσης`,
        sv: (m: number) => `${m} min läsning`,
        da: (m: number) => `${m} min læsning`,
        fi: (m: number) => `${m} min lukuaika`,
        cs: (m: number) => `${m} min čtení`,
        sk: (m: number) => `${m} min čítania`,
        hu: (m: number) => `${m} perc olvasás`,
        bg: (m: number) => `${m} мин четене`,
        hr: (m: number) => `${m} min čitanja`,
        sl: (m: number) => `${m} min branja`,
        et: (m: number) => `${m} min lugemist`,
        lv: (m: number) => `${m} min lasīšanas`,
        lt: (m: number) => `${m} min skaitymo`,
        ga: (m: number) => `${m} nóim léitheoireachta`,
        mt: (m: number) => `${m} min qari`,
    },
    docsPrevious: {
        en: "Previous", fr: "Précédent", de: "Vorherige", es: "Anterior", it: "Precedente",
        pt: "Anterior", nl: "Vorige", pl: "Poprzednia", ro: "Anterior", el: "Προηγούμενο",
        sv: "Föregående", da: "Forrige", fi: "Edellinen", cs: "Předchozí", sk: "Predchádzajúca",
        hu: "Előző", bg: "Предишна", hr: "Prethodna", sl: "Prejšnja", et: "Eelmine",
        lv: "Iepriekšējā", lt: "Ankstesnis", ga: "Roimhe seo", mt: "Preċedenti",
    },
    docsNext: {
        en: "Next", fr: "Suivant", de: "Weiter", es: "Siguiente", it: "Successivo",
        pt: "Próximo", nl: "Volgende", pl: "Następna", ro: "Următor", el: "Επόμενο",
        sv: "Nästa", da: "Næste", fi: "Seuraava", cs: "Další", sk: "Ďalšia",
        hu: "Következő", bg: "Следваща", hr: "Sljedeća", sl: "Naslednja", et: "Järgmine",
        lv: "Nākamā", lt: "Kitas", ga: "Ar aghaidh", mt: "Li jmiss",
    },
    docsFeedbackQuestion: {
        en: "Was this page helpful?", fr: "Cette page vous a-t-elle été utile ?",
        de: "War diese Seite hilfreich?", es: "¿Te resultó útil esta página?",
        it: "Questa pagina è stata utile?", pt: "Esta página foi útil?",
        nl: "Was deze pagina nuttig?", pl: "Czy ta strona była pomocna?",
        ro: "Această pagină v-a fost utilă?", el: "Ήταν χρήσιμη αυτή η σελίδα;",
        sv: "Var den här sidan till hjälp?", da: "Var denne side nyttig?",
        fi: "Oliko tästä sivusta apua?", cs: "Byla tato stránka užitečná?",
        sk: "Bola táto stránka užitočná?", hu: "Hasznos volt ez az oldal?",
        bg: "Полезна ли беше тази страница?", hr: "Je li ova stranica bila korisna?",
        sl: "Je bila ta stran koristna?", et: "Kas see leht oli abiks?",
        lv: "Vai šī lapa bija noderīga?", lt: "Ar šis puslapis buvo naudingas?",
        ga: "An raibh an leathanach seo cabhrach?", mt: "Din il-paġna kienet ta' għajnuna?",
    },
    docsFeedbackYes: {
        en: "Yes", fr: "Oui", de: "Ja", es: "Sí", it: "Sì", pt: "Sim", nl: "Ja", pl: "Tak",
        ro: "Da", el: "Ναι", sv: "Ja", da: "Ja", fi: "Kyllä", cs: "Ano", sk: "Áno", hu: "Igen",
        bg: "Да", hr: "Da", sl: "Da", et: "Jah", lv: "Jā", lt: "Taip", ga: "Tá", mt: "Iva",
    },
    docsFeedbackNo: {
        en: "No", fr: "Non", de: "Nein", es: "No", it: "No", pt: "Não", nl: "Nee", pl: "Nie",
        ro: "Nu", el: "Όχι", sv: "Nej", da: "Nej", fi: "Ei", cs: "Ne", sk: "Nie", hu: "Nem",
        bg: "Не", hr: "Ne", sl: "Ne", et: "Ei", lv: "Nē", lt: "Ne", ga: "Níl", mt: "Le",
    },
    docsFeedbackThanks: {
        en: "Thanks for the feedback!", fr: "Merci pour votre retour !",
        de: "Danke für Ihr Feedback!", es: "¡Gracias por tu comentario!",
        it: "Grazie per il feedback!", pt: "Obrigado pelo feedback!",
        nl: "Bedankt voor je feedback!", pl: "Dziękujemy za opinię!",
        ro: "Mulțumim pentru feedback!", el: "Ευχαριστούμε για τα σχόλια!",
        sv: "Tack för din feedback!", da: "Tak for din feedback!",
        fi: "Kiitos palautteesta!", cs: "Děkujeme za zpětnou vazbu!",
        sk: "Ďakujeme za spätnú väzbu!", hu: "Köszönjük a visszajelzést!",
        bg: "Благодарим за обратната връзка!", hr: "Hvala na povratnim informacijama!",
        sl: "Hvala za povratne informacije!", et: "Täname tagasiside eest!",
        lv: "Paldies par atsauksmi!", lt: "Ačiū už atsiliepimą!",
        ga: "Go raibh maith agat as an aiseolas!", mt: "Grazzi tal-feedback!",
    },
    docsSearchPlaceholder: {
        en: "Search docs…", fr: "Rechercher dans la doc…", de: "Dokumentation durchsuchen…",
        es: "Buscar en la documentación…", it: "Cerca nella documentazione…",
        pt: "Pesquisar na documentação…", nl: "Zoek in de documentatie…",
        pl: "Szukaj w dokumentacji…", ro: "Caută în documentație…",
        el: "Αναζήτηση στην τεκμηρίωση…", sv: "Sök i dokumentationen…",
        da: "Søg i dokumentationen…", fi: "Hae dokumentaatiosta…",
        cs: "Hledat v dokumentaci…", sk: "Hľadať v dokumentácii…",
        hu: "Keresés a dokumentációban…", bg: "Търсене в документацията…",
        hr: "Pretraži dokumentaciju…", sl: "Iskanje po dokumentaciji…",
        et: "Otsi dokumentatsioonist…", lv: "Meklēt dokumentācijā…",
        lt: "Ieškoti dokumentacijoje…", ga: "Cuardaigh na doiciméid…",
        mt: "Fittex fid-dokumentazzjoni…",
    },
    docsSearchEmpty: {
        en: "No results", fr: "Aucun résultat", de: "Keine Ergebnisse", es: "Sin resultados",
        it: "Nessun risultato", pt: "Sem resultados", nl: "Geen resultaten", pl: "Brak wyników",
        ro: "Niciun rezultat", el: "Κανένα αποτέλεσμα", sv: "Inga resultat", da: "Ingen resultater",
        fi: "Ei tuloksia", cs: "Žádné výsledky", sk: "Žiadne výsledky", hu: "Nincs találat",
        bg: "Няма резултати", hr: "Nema rezultata", sl: "Ni rezultatov", et: "Tulemusi pole",
        lv: "Nav rezultātu", lt: "Nėra rezultatų", ga: "Gan torthaí", mt: "L-ebda riżultat",
    },
    docsBrowseByTopic: {
        en: "Browse by topic", fr: "Parcourir par thème", de: "Nach Thema stöbern", es: "Explorar por tema",
        it: "Sfoglia per argomento", pt: "Navegar por tema", nl: "Bladeren op onderwerp", pl: "Przeglądaj według tematu",
        ro: "Răsfoiți după subiect", el: "Περιήγηση ανά θέμα", sv: "Bläddra efter ämne", da: "Gennemse efter emne",
        fi: "Selaa aiheittain", cs: "Procházet podle tématu", sk: "Prehľadávať podľa témy", hu: "Böngészés téma szerint",
        bg: "Преглед по тема", hr: "Pregledaj po temi", sl: "Prebrskaj po temi", et: "Sirvi teemade kaupa",
        lv: "Pārlūkot pēc tēmas", lt: "Naršyti pagal temą", ga: "Brabhsáil de réir ábhair", mt: "Fittex skont is-suġġett",
    },
    docsRecentlyUpdated: {
        en: "Recently updated", fr: "Mis à jour récemment", de: "Kürzlich aktualisiert", es: "Actualizado recientemente",
        it: "Aggiornati di recente", pt: "Atualizado recentemente", nl: "Onlangs bijgewerkt", pl: "Ostatnio zaktualizowane",
        ro: "Actualizate recent", el: "Πρόσφατα ενημερωμένα", sv: "Nyligen uppdaterade", da: "Opdateret for nylig",
        fi: "Äskettäin päivitetyt", cs: "Nedávno aktualizováno", sk: "Nedávno aktualizované", hu: "Nemrég frissítve",
        bg: "Наскоро актуализирани", hr: "Nedavno ažurirano", sl: "Nedavno posodobljeno", et: "Hiljuti uuendatud",
        lv: "Nesen atjaunināts", lt: "Neseniai atnaujinta", ga: "Nuashonraithe le déanaí", mt: "Aġġornat reċentement",
    },
    docsFilterPages: {
        en: "Filter pages", fr: "Filtrer les pages", de: "Seiten filtern", es: "Filtrar páginas",
        it: "Filtra le pagine", pt: "Filtrar páginas", nl: "Pagina's filteren", pl: "Filtruj strony",
        ro: "Filtrați paginile", el: "Φιλτράρισμα σελίδων", sv: "Filtrera sidor", da: "Filtrér sider",
        fi: "Suodata sivuja", cs: "Filtrovat stránky", sk: "Filtrovať stránky", hu: "Oldalak szűrése",
        bg: "Филтриране на страници", hr: "Filtriraj stranice", sl: "Filtriraj strani", et: "Filtreeri lehti",
        lv: "Filtrēt lapas", lt: "Filtruoti puslapius", ga: "Scag leathanaigh", mt: "Iffiltra l-paġni",
    },
    docsClearFilter: {
        en: "Clear filter", fr: "Effacer le filtre", de: "Filter zurücksetzen", es: "Borrar filtro",
        it: "Cancella filtro", pt: "Limpar filtro", nl: "Filter wissen", pl: "Wyczyść filtr",
        ro: "Ștergeți filtrul", el: "Καθαρισμός φίλτρου", sv: "Rensa filter", da: "Ryd filter",
        fi: "Tyhjennä suodatin", cs: "Zrušit filtr", sk: "Zrušiť filter", hu: "Szűrő törlése",
        bg: "Изчистване на филтъра", hr: "Očisti filtar", sl: "Počisti filter", et: "Tühjenda filter",
        lv: "Notīrīt filtru", lt: "Išvalyti filtrą", ga: "Glan an scagaire", mt: "Neħħi l-filtru",
    },
    docsPageCount: {
        en: (n: number) => `${n} ${n === 1 ? "page" : "pages"}`,
        fr: (n: number) => `${n} page${n === 1 ? "" : "s"}`,
        de: (n: number) => `${n} ${n === 1 ? "Seite" : "Seiten"}`,
        es: (n: number) => `${n} página${n === 1 ? "" : "s"}`,
        it: (n: number) => `${n} pagin${n === 1 ? "a" : "e"}`,
        pt: (n: number) => `${n} página${n === 1 ? "" : "s"}`,
        nl: (n: number) => `${n} pagina${n === 1 ? "" : "'s"}`,
        pl: (n: number) => `${n} ${n === 1 ? "strona" : "stron"}`,
        ro: (n: number) => `${n} ${n === 1 ? "pagină" : "pagini"}`,
        el: (n: number) => `${n} ${n === 1 ? "σελίδα" : "σελίδες"}`,
        sv: (n: number) => `${n} ${n === 1 ? "sida" : "sidor"}`,
        da: (n: number) => `${n} ${n === 1 ? "side" : "sider"}`,
        fi: (n: number) => `${n} ${n === 1 ? "sivu" : "sivua"}`,
        cs: (n: number) => `${n} ${n === 1 ? "stránka" : "stránek"}`,
        sk: (n: number) => `${n} ${n === 1 ? "stránka" : "stránok"}`,
        hu: (n: number) => `${n} oldal`,
        bg: (n: number) => `${n} ${n === 1 ? "страница" : "страници"}`,
        hr: (n: number) => `${n} ${n === 1 ? "stranica" : "stranica"}`,
        sl: (n: number) => `${n} ${n === 1 ? "stran" : "strani"}`,
        et: (n: number) => `${n} ${n === 1 ? "lehekülg" : "lehekülge"}`,
        lv: (n: number) => `${n} ${n === 1 ? "lapa" : "lapas"}`,
        lt: (n: number) => `${n} ${n === 1 ? "puslapis" : "puslapiai"}`,
        ga: (n: number) => `${n} ${n === 1 ? "leathanach" : "leathanach"}`,
        mt: (n: number) => `${n} paġn${n === 1 ? "a" : "i"}`,
    },
    docsArticleCount: {
        en: (n: number) => `${n} ${n === 1 ? "article" : "articles"}`,
        fr: (n: number) => `${n} article${n === 1 ? "" : "s"}`,
        de: (n: number) => `${n} ${n === 1 ? "Artikel" : "Artikel"}`,
        es: (n: number) => `${n} artículo${n === 1 ? "" : "s"}`,
        it: (n: number) => `${n} articol${n === 1 ? "o" : "i"}`,
        pt: (n: number) => `${n} artigo${n === 1 ? "" : "s"}`,
        nl: (n: number) => `${n} artikel${n === 1 ? "" : "en"}`,
        pl: (n: number) => `${n} ${n === 1 ? "artykuł" : "artykułów"}`,
        ro: (n: number) => `${n} articol${n === 1 ? "" : "e"}`,
        el: (n: number) => `${n} ${n === 1 ? "άρθρο" : "άρθρα"}`,
        sv: (n: number) => `${n} ${n === 1 ? "artikel" : "artiklar"}`,
        da: (n: number) => `${n} ${n === 1 ? "artikel" : "artikler"}`,
        fi: (n: number) => `${n} ${n === 1 ? "artikkeli" : "artikkelia"}`,
        cs: (n: number) => `${n} ${n === 1 ? "článek" : "článků"}`,
        sk: (n: number) => `${n} ${n === 1 ? "článok" : "článkov"}`,
        hu: (n: number) => `${n} cikk`,
        bg: (n: number) => `${n} ${n === 1 ? "статия" : "статии"}`,
        hr: (n: number) => `${n} ${n === 1 ? "članak" : "članaka"}`,
        sl: (n: number) => `${n} ${n === 1 ? "članek" : "člankov"}`,
        et: (n: number) => `${n} ${n === 1 ? "artikkel" : "artiklit"}`,
        lv: (n: number) => `${n} ${n === 1 ? "raksts" : "raksti"}`,
        lt: (n: number) => `${n} ${n === 1 ? "straipsnis" : "straipsniai"}`,
        ga: (n: number) => `${n} ${n === 1 ? "alt" : "alt"}`,
        mt: (n: number) => `${n} artikl${n === 1 ? "u" : "i"}`,
    },
    docsTopicCount: {
        en: (n: number) => `${n} ${n === 1 ? "topic" : "topics"}`,
        fr: (n: number) => `${n} thème${n === 1 ? "" : "s"}`,
        de: (n: number) => `${n} ${n === 1 ? "Thema" : "Themen"}`,
        es: (n: number) => `${n} tema${n === 1 ? "" : "s"}`,
        it: (n: number) => `${n} argoment${n === 1 ? "o" : "i"}`,
        pt: (n: number) => `${n} tema${n === 1 ? "" : "s"}`,
        nl: (n: number) => `${n} onderwerp${n === 1 ? "" : "en"}`,
        pl: (n: number) => `${n} ${n === 1 ? "temat" : "tematów"}`,
        ro: (n: number) => `${n} subiect${n === 1 ? "" : "e"}`,
        el: (n: number) => `${n} ${n === 1 ? "θέμα" : "θέματα"}`,
        sv: (n: number) => `${n} ${n === 1 ? "ämne" : "ämnen"}`,
        da: (n: number) => `${n} ${n === 1 ? "emne" : "emner"}`,
        fi: (n: number) => `${n} ${n === 1 ? "aihe" : "aihetta"}`,
        cs: (n: number) => `${n} ${n === 1 ? "téma" : "témat"}`,
        sk: (n: number) => `${n} ${n === 1 ? "téma" : "tém"}`,
        hu: (n: number) => `${n} téma`,
        bg: (n: number) => `${n} ${n === 1 ? "тема" : "теми"}`,
        hr: (n: number) => `${n} ${n === 1 ? "tema" : "tema"}`,
        sl: (n: number) => `${n} ${n === 1 ? "tema" : "tem"}`,
        et: (n: number) => `${n} ${n === 1 ? "teema" : "teemat"}`,
        lv: (n: number) => `${n} ${n === 1 ? "tēma" : "tēmas"}`,
        lt: (n: number) => `${n} ${n === 1 ? "tema" : "temos"}`,
        ga: (n: number) => `${n} ${n === 1 ? "topaic" : "topaic"}`,
        mt: (n: number) => `${n} suġġett${n === 1 ? "" : "i"}`,
    },
    docsResultCount: {
        en: (n: number, q: string) => `${n} ${n === 1 ? "page matches" : "pages match"} “${q}”`,
        fr: (n: number, q: string) => `${n} page${n === 1 ? "" : "s"} correspond${n === 1 ? "" : "ent"} à « ${q} »`,
        de: (n: number, q: string) => `${n} ${n === 1 ? "Seite passt" : "Seiten passen"} zu „${q}“`,
        es: (n: number, q: string) => `${n} página${n === 1 ? "" : "s"} coincide${n === 1 ? "" : "n"} con «${q}»`,
        it: (n: number, q: string) => `${n} pagin${n === 1 ? "a corrisponde" : "e corrispondono"} a “${q}”`,
        pt: (n: number, q: string) => `${n} página${n === 1 ? "" : "s"} corresponde${n === 1 ? "" : "m"} a “${q}”`,
        nl: (n: number, q: string) => `${n} pagina${n === 1 ? "" : "'s"} ${n === 1 ? "komt" : "komen"} overeen met “${q}”`,
        pl: (n: number, q: string) => `Pasujące strony: ${n} – „${q}”`,
        ro: (n: number, q: string) => `${n} ${n === 1 ? "pagină corespunde" : "pagini corespund"} cu „${q}”`,
        el: (n: number, q: string) => `${n} ${n === 1 ? "σελίδα ταιριάζει" : "σελίδες ταιριάζουν"} με «${q}»`,
        sv: (n: number, q: string) => `${n} ${n === 1 ? "sida matchar" : "sidor matchar"} ”${q}”`,
        da: (n: number, q: string) => `${n} ${n === 1 ? "side matcher" : "sider matcher"} “${q}”`,
        fi: (n: number, q: string) => `${n} ${n === 1 ? "sivu vastaa" : "sivua vastaa"} hakua ”${q}”`,
        cs: (n: number, q: string) => `Odpovídající stránky: ${n} – „${q}“`,
        sk: (n: number, q: string) => `Zodpovedajúce stránky: ${n} – „${q}“`,
        hu: (n: number, q: string) => `${n} oldal egyezik: „${q}”`,
        bg: (n: number, q: string) => `Съвпадащи страници: ${n} – „${q}“`,
        hr: (n: number, q: string) => `Podudarne stranice: ${n} – „${q}“`,
        sl: (n: number, q: string) => `Ujemajoče se strani: ${n} – „${q}“`,
        et: (n: number, q: string) => `Vastavaid lehti: ${n} – „${q}”`,
        lv: (n: number, q: string) => `Atbilstošās lapas: ${n} – „${q}“`,
        lt: (n: number, q: string) => `Atitinkantys puslapiai: ${n} – „${q}“`,
        ga: (n: number, q: string) => `${n} leathanach ag teacht le “${q}”`,
        mt: (n: number, q: string) => `${n} paġn${n === 1 ? "a taqbel" : "i jaqblu"} ma’ “${q}”`,
    },
    docsNoMatches: {
        en: (q: string) => `Nothing matches “${q}”`,
        fr: (q: string) => `Aucun résultat pour « ${q} »`,
        de: (q: string) => `Nichts passt zu „${q}“`,
        es: (q: string) => `Nada coincide con «${q}»`,
        it: (q: string) => `Nessun risultato per “${q}”`,
        pt: (q: string) => `Nada corresponde a “${q}”`,
        nl: (q: string) => `Niets komt overeen met “${q}”`,
        pl: (q: string) => `Nic nie pasuje do „${q}”`,
        ro: (q: string) => `Nimic nu corespunde cu „${q}”`,
        el: (q: string) => `Τίποτα δεν ταιριάζει με «${q}»`,
        sv: (q: string) => `Inget matchar ”${q}”`,
        da: (q: string) => `Intet matcher “${q}”`,
        fi: (q: string) => `Mikään ei vastaa hakua ”${q}”`,
        cs: (q: string) => `Nic neodpovídá „${q}“`,
        sk: (q: string) => `Nič nezodpovedá „${q}“`,
        hu: (q: string) => `Semmi sem egyezik ezzel: „${q}”`,
        bg: (q: string) => `Няма съвпадения с „${q}“`,
        hr: (q: string) => `Ništa ne odgovara „${q}“`,
        sl: (q: string) => `Nič se ne ujema z „${q}“`,
        et: (q: string) => `Mitte miski ei vasta otsingule „${q}”`,
        lv: (q: string) => `Nekas neatbilst „${q}“`,
        lt: (q: string) => `Niekas neatitinka „${q}“`,
        ga: (q: string) => `Níl aon rud ag teacht le “${q}”`,
        mt: (q: string) => `Xejn ma jaqbel ma’ “${q}”`,
    },
    docsUpdatedOn: {
        en: (d: string) => `Updated ${d}`,
        fr: (d: string) => `Mis à jour le ${d}`,
        de: (d: string) => `Aktualisiert am ${d}`,
        es: (d: string) => `Actualizado el ${d}`,
        it: (d: string) => `Aggiornato il ${d}`,
        pt: (d: string) => `Atualizado em ${d}`,
        nl: (d: string) => `Bijgewerkt op ${d}`,
        pl: (d: string) => `Zaktualizowano ${d}`,
        ro: (d: string) => `Actualizat pe ${d}`,
        el: (d: string) => `Ενημερώθηκε στις ${d}`,
        sv: (d: string) => `Uppdaterad ${d}`,
        da: (d: string) => `Opdateret ${d}`,
        fi: (d: string) => `Päivitetty ${d}`,
        cs: (d: string) => `Aktualizováno ${d}`,
        sk: (d: string) => `Aktualizované ${d}`,
        hu: (d: string) => `Frissítve: ${d}`,
        bg: (d: string) => `Актуализирано на ${d}`,
        hr: (d: string) => `Ažurirano ${d}`,
        sl: (d: string) => `Posodobljeno ${d}`,
        et: (d: string) => `Uuendatud ${d}`,
        lv: (d: string) => `Atjaunināts ${d}`,
        lt: (d: string) => `Atnaujinta ${d}`,
        ga: (d: string) => `Nuashonraithe ${d}`,
        mt: (d: string) => `Aġġornat ${d}`,
    },
    docsTitle: {
        en: "Documentation", fr: "Documentation", de: "Dokumentation", es: "Documentación",
        it: "Documentazione", pt: "Documentação", nl: "Documentatie", pl: "Dokumentacja",
        ro: "Documentație", el: "Τεκμηρίωση", sv: "Dokumentation", da: "Dokumentation",
        fi: "Dokumentaatio", cs: "Dokumentace", sk: "Dokumentácia", hu: "Dokumentáció",
        bg: "Документация", hr: "Dokumentacija", sl: "Dokumentacija", et: "Dokumentatsioon",
        lv: "Dokumentācija", lt: "Dokumentacija", ga: "Doiciméadú", mt: "Dokumentazzjoni",
    },
    docsOpenNav: {
        en: "Open navigation", fr: "Ouvrir la navigation", de: "Navigation öffnen", es: "Abrir navegación",
        it: "Apri navigazione", pt: "Abrir navegação", nl: "Navigatie openen", pl: "Otwórz nawigację",
        ro: "Deschide navigarea", el: "Άνοιγμα πλοήγησης", sv: "Öppna navigering", da: "Åbn navigation",
        fi: "Avaa navigointi", cs: "Otevřít navigaci", sk: "Otvoriť navigáciu", hu: "Navigáció megnyitása",
        bg: "Отваряне на навигацията", hr: "Otvori navigaciju", sl: "Odpri navigacijo", et: "Ava navigeerimine",
        lv: "Atvērt navigāciju", lt: "Atidaryti naršymą", ga: "Oscail an nascleanúint", mt: "Iftaħ in-navigazzjoni",
    },
    docsCloseNav: {
        en: "Close navigation", fr: "Fermer la navigation", de: "Navigation schließen", es: "Cerrar navegación",
        it: "Chiudi navigazione", pt: "Fechar navegação", nl: "Navigatie sluiten", pl: "Zamknij nawigację",
        ro: "Închide navigarea", el: "Κλείσιμο πλοήγησης", sv: "Stäng navigering", da: "Luk navigation",
        fi: "Sulje navigointi", cs: "Zavřít navigaci", sk: "Zavrieť navigáciu", hu: "Navigáció bezárása",
        bg: "Затваряне на навигацията", hr: "Zatvori navigaciju", sl: "Zapri navigacijo", et: "Sulge navigeerimine",
        lv: "Aizvērt navigāciju", lt: "Uždaryti naršymą", ga: "Dún an nascleanúint", mt: "Agħlaq in-navigazzjoni",
    },
    docsLanguage: {
        en: "Language", fr: "Langue", de: "Sprache", es: "Idioma", it: "Lingua", pt: "Idioma",
        nl: "Taal", pl: "Język", ro: "Limbă", el: "Γλώσσα", sv: "Språk", da: "Sprog", fi: "Kieli",
        cs: "Jazyk", sk: "Jazyk", hu: "Nyelv", bg: "Език", hr: "Jezik", sl: "Jezik", et: "Keel",
        lv: "Valoda", lt: "Kalba", ga: "Teanga", mt: "Lingwa",
    },
    docsChangeLanguage: {
        en: "Change language", fr: "Changer de langue", de: "Sprache ändern", es: "Cambiar idioma",
        it: "Cambia lingua", pt: "Mudar idioma", nl: "Taal wijzigen", pl: "Zmień język",
        ro: "Schimbă limba", el: "Αλλαγή γλώσσας", sv: "Byt språk", da: "Skift sprog",
        fi: "Vaihda kieli", cs: "Změnit jazyk", sk: "Zmeniť jazyk", hu: "Nyelv váltása",
        bg: "Смяна на езика", hr: "Promijeni jezik", sl: "Spremeni jezik", et: "Muuda keelt",
        lv: "Mainīt valodu", lt: "Keisti kalbą", ga: "Athraigh teanga", mt: "Ibdel il-lingwa",
    },
});

/**
 * The set of resolved default labels the blog components fall back to when a label prop is
 * omitted. `readingLabel` stays a function because the minute count is a runtime value.
 */
export interface BlogLabels {
    /** Empty-state message when no post matches the search/filter. */
    empty: string;
    /** Call-to-action at the bottom of each overview card. */
    readMore: string;
    /** Placeholder for the overview search box. */
    searchPlaceholder: string;
    /** Label for the "load more" button. */
    loadMore: string;
    /** Label for the filter button that clears the category filter. */
    allCategories: string;
    /** Back-link label above a post's title. */
    back: string;
    /** Heading for the post sidebar's minimap. */
    onThisPage: string;
    /** Heading for the post sidebar's similar-post list. */
    similarPages: string;
    /** Accessible label for the category filter group. */
    filterByCategory: string;
    /** Eyebrow above the author's name in the post's bottom author bio. */
    writtenBy: string;
    /** Builds the "Published <date>" line of the author bio from the formatted date. */
    publishedLabel: (date: string) => string;
    /** Builds the reading-time label from the estimated whole minutes. */
    readingLabel: (minutes: number) => string;
}

/**
 * Resolve the full set of default {@link BlogLabels} for a blog's `lang`, matched to a
 * {@link Language} via {@link resolveLanguage} (so `"fr"`, `"pt-BR"`, or an unknown code all
 * resolve sensibly). Components use these as the fallback for any label prop left unset.
 *
 * @param lang - the blog's language code (a `LocaleConfig.code`).
 * @returns the resolved labels for that language.
 */
export function blogLabels(lang: string): BlogLabels {
    const t = ui.translator(resolveLanguage(lang));
    return {
        empty: t(CATALOG.empty),
        readMore: t(CATALOG.readMore),
        searchPlaceholder: t(CATALOG.searchPlaceholder),
        loadMore: t(CATALOG.loadMore),
        allCategories: t(CATALOG.allCategories),
        back: t(CATALOG.back),
        onThisPage: t(CATALOG.onThisPage),
        similarPages: t(CATALOG.similarPages),
        filterByCategory: t(CATALOG.filterByCategory),
        writtenBy: t(CATALOG.writtenBy),
        publishedLabel: (date: string) => t(CATALOG.publishedOn, date),
        readingLabel: (minutes: number) => t(CATALOG.readingTime, minutes),
    };
}

/**
 * The set of resolved default labels the docs components fall back to when a label prop is
 * omitted. Shares `onThisPage` and the `readingLabel` builder with {@link BlogLabels}; the rest
 * are docs-only copy (prev/next, the feedback widget, the search palette, "Updated <date>").
 */
export interface DocsLabels {
    /** The localized word "Documentation" - the default docs nav label and index hero heading. */
    title: string;
    /** Heading for the page's right-hand table-of-contents minimap. */
    onThisPage: string;
    /** Label for the "previous page" prev/next footer card. */
    previous: string;
    /** Label for the "next page" prev/next footer card. */
    next: string;
    /** The "Was this page helpful?" feedback prompt. */
    feedbackQuestion: string;
    /** Affirmative feedback button label. */
    feedbackYes: string;
    /** Negative feedback button label. */
    feedbackNo: string;
    /** Confirmation shown after the reader answers the feedback prompt. */
    feedbackThanks: string;
    /** Placeholder for the search box / command palette input. */
    searchPlaceholder: string;
    /** Message shown in the command palette when a query matches no page. */
    searchEmpty: string;
    /** Accessible name for the navbar's nav-drawer button while the drawer is CLOSED. */
    openNav: string;
    /** Accessible name for the navbar's nav-drawer button while the drawer is OPEN. */
    closeNav: string;
    /** Heading above the language list in the language picker. */
    language: string;
    /** Accessible name for the language picker's trigger button. */
    changeLanguage: string;
    /** Builds the "Updated <date>" meta line from the formatted date. */
    updatedLabel: (date: string) => string;
    /** Builds the reading-time label from the estimated whole minutes. */
    readingLabel: (minutes: number) => string;
    /** Heading above the docs index's topic grid. */
    browseByTopic: string;
    /** Heading above the docs index's recently-updated list. */
    recentlyUpdated: string;
    /** Placeholder for the topic grid's page filter. */
    filterPages: string;
    /** Label and accessible name for the control that empties the page filter. */
    clearFilter: string;
    /** Builds a topic card's "<n> pages" footer link. */
    pageCountLabel: (count: number) => string;
    /** Builds the hero's "<n> articles" statistic. */
    articleCountLabel: (count: number) => string;
    /** Builds the hero's "<n> topics" statistic. */
    topicCountLabel: (count: number) => string;
    /** Builds the filter result heading, e.g. `3 pages match "calendar"`. */
    resultCountLabel: (count: number, query: string) => string;
    /** Builds the empty-filter heading, e.g. `Nothing matches "xyzzy"`. */
    noMatchesLabel: (query: string) => string;
}

/**
 * Resolve the full set of default {@link DocsLabels} for a docs site's `lang`, matched to a
 * {@link Language} via {@link resolveLanguage} (so `"fr"`, `"pt-BR"`, or an unknown code all
 * resolve sensibly). The docs components use these as the fallback for any label prop left unset.
 *
 * @param lang - the docs' language code (a `LocaleConfig.code`).
 * @returns the resolved labels for that language.
 */
export function docsLabels(lang: string): DocsLabels {
    const t = ui.translator(resolveLanguage(lang));
    return {
        title: t(CATALOG.docsTitle),
        onThisPage: t(CATALOG.onThisPage),
        previous: t(CATALOG.docsPrevious),
        next: t(CATALOG.docsNext),
        feedbackQuestion: t(CATALOG.docsFeedbackQuestion),
        feedbackYes: t(CATALOG.docsFeedbackYes),
        feedbackNo: t(CATALOG.docsFeedbackNo),
        feedbackThanks: t(CATALOG.docsFeedbackThanks),
        searchPlaceholder: t(CATALOG.docsSearchPlaceholder),
        searchEmpty: t(CATALOG.docsSearchEmpty),
        openNav: t(CATALOG.docsOpenNav),
        closeNav: t(CATALOG.docsCloseNav),
        language: t(CATALOG.docsLanguage),
        changeLanguage: t(CATALOG.docsChangeLanguage),
        updatedLabel: (date: string) => t(CATALOG.docsUpdatedOn, date),
        readingLabel: (minutes: number) => t(CATALOG.readingTime, minutes),
        browseByTopic: t(CATALOG.docsBrowseByTopic),
        recentlyUpdated: t(CATALOG.docsRecentlyUpdated),
        filterPages: t(CATALOG.docsFilterPages),
        clearFilter: t(CATALOG.docsClearFilter),
        pageCountLabel: (count: number) => t(CATALOG.docsPageCount, count),
        articleCountLabel: (count: number) => t(CATALOG.docsArticleCount, count),
        topicCountLabel: (count: number) => t(CATALOG.docsTopicCount, count),
        resultCountLabel: (count: number, query: string) => t(CATALOG.docsResultCount, count, query),
        noMatchesLabel: (query: string) => t(CATALOG.docsNoMatches, query),
    };
}
