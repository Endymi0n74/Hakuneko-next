import type { LocaleID } from '../../../i18n/ILocale';

export type NextLocaleStrings = {
    productDescription: string;
    home: string;
    bookmarks: string;
    monitoring: string;
    pasteMediaUrl: string;
    plugins: string;
    importExport: string;
    settings: string;
    general: string;
    interface: string;
    viewer: string;
    trackers: string;
    help: string;
    documentation: string;
    openTicket: string;
    website: string;
    showIp: string;
    about: string;
    sourceCode: string;
    version: string;
    maintainer: string;
    contributors: string;
    artwork: string;
    itemList: string;
    allLanguages: string;
    displayedLanguages: string;
    selectAll: string;
    selectNone: string;
    search: string;
    items: string;
    welcomeTitle: string;
    welcomeBody: string;
    basedOn: string;
    releaseHighlights: string;
    featureMonitoring: string;
    featureLanguages: string;
    featureMangaFire: string;
};

const strings: Record<'en' | 'fr' | 'pt', NextLocaleStrings> = {
    en: {
        productDescription: 'Manga, anime and novel downloader',
        home: 'Home',
        bookmarks: 'Bookmarks',
        monitoring: 'Monitoring',
        pasteMediaUrl: 'Paste media URL',
        plugins: 'Plugins',
        importExport: 'Import / export',
        settings: 'Settings',
        general: 'General',
        interface: 'Interface',
        viewer: 'Viewer',
        trackers: 'Trackers',
        help: 'Help',
        documentation: 'Documentation',
        openTicket: 'Open a ticket',
        website: 'Website',
        showIp: 'Show IP and location',
        about: 'About',
        sourceCode: 'Source code',
        version: 'HakuNeko-Next 1.4.0',
        maintainer: 'Maintainer: Endymion',
        contributors: 'Contributors',
        artwork: 'Artwork',
        itemList: 'Chapter list',
        allLanguages: 'All languages',
        displayedLanguages: 'Displayed languages',
        selectAll: 'All',
        selectNone: 'None',
        search: 'Search…',
        items: 'Items',
        welcomeTitle: 'HakuNeko-Next (=^･ω･^=)',
        welcomeBody: 'Download manga, anime and novels for offline reading and viewing.',
        basedOn: 'Community fork based on HakuNeko.',
        releaseHighlights: 'Version 1.4.0 highlights',
        featureMonitoring: 'Automatic library monitoring',
        featureLanguages: 'Multilingual chapter filtering',
        featureMangaFire: 'MangaFire interactive security support',
    },
    fr: {
        productDescription: 'Téléchargeur de mangas, animés et romans',
        home: 'Accueil',
        bookmarks: 'Favoris',
        monitoring: 'Surveillance',
        pasteMediaUrl: 'Coller une URL de média',
        plugins: 'Plugins',
        importExport: 'Importer / exporter',
        settings: 'Paramètres',
        general: 'Général',
        interface: 'Interface',
        viewer: 'Lecteur',
        trackers: 'Trackers',
        help: 'Aide',
        documentation: 'Documentation',
        openTicket: 'Signaler un problème',
        website: 'Site web',
        showIp: 'Afficher l’IP et la localisation',
        about: 'À propos',
        sourceCode: 'Code source',
        version: 'HakuNeko-Next 1.4.0',
        maintainer: 'Maintenance : Endymion',
        contributors: 'Contributeurs',
        artwork: 'Illustrations',
        itemList: 'Liste des chapitres',
        allLanguages: 'Toutes les langues',
        displayedLanguages: 'Langues affichées',
        selectAll: 'Toutes',
        selectNone: 'Aucune',
        search: 'Rechercher…',
        items: 'Éléments',
        welcomeTitle: 'HakuNeko-Next (=^･ω･^=)',
        welcomeBody: 'Téléchargez mangas, animés et romans pour les lire ou les regarder hors ligne.',
        basedOn: 'Fork communautaire basé sur HakuNeko.',
        releaseHighlights: 'Nouveautés de la version 1.4.0',
        featureMonitoring: 'Surveillance automatique de la bibliothèque',
        featureLanguages: 'Filtrage multilingue des chapitres',
        featureMangaFire: 'Prise en charge de la sécurité interactive MangaFire',
    },
    pt: {
        productDescription: 'Downloader de mangás, animes e novels',
        home: 'Início',
        bookmarks: 'Favoritos',
        monitoring: 'Monitoramento',
        pasteMediaUrl: 'Colar URL de mídia',
        plugins: 'Plugins',
        importExport: 'Importar / exportar',
        settings: 'Configurações',
        general: 'Geral',
        interface: 'Interface',
        viewer: 'Leitor',
        trackers: 'Rastreadores',
        help: 'Ajuda',
        documentation: 'Documentação',
        openTicket: 'Abrir chamado',
        website: 'Site',
        showIp: 'Mostrar IP e localização',
        about: 'Sobre',
        sourceCode: 'Código-fonte',
        version: 'HakuNeko-Next 1.4.0',
        maintainer: 'Manutenção: Endymion',
        contributors: 'Colaboradores',
        artwork: 'Ilustrações',
        itemList: 'Lista de capítulos',
        allLanguages: 'Todos os idiomas',
        displayedLanguages: 'Idiomas exibidos',
        selectAll: 'Todos',
        selectNone: 'Nenhum',
        search: 'Pesquisar…',
        items: 'Itens',
        welcomeTitle: 'HakuNeko-Next (=^･ω･^=)',
        welcomeBody: 'Baixe mangás, animes e novels para ler ou assistir offline.',
        basedOn: 'Fork comunitário baseado no HakuNeko.',
        releaseHighlights: 'Destaques da versão 1.4.0',
        featureMonitoring: 'Monitoramento automático da biblioteca',
        featureLanguages: 'Filtro multilíngue de capítulos',
        featureMangaFire: 'Suporte à verificação interativa do MangaFire',
    },
};

export function GetNextLocale(localeID: LocaleID): NextLocaleStrings {
    if(localeID === 'Locale_frFR') return strings.fr;
    if(localeID === 'Locale_ptPT') return strings.pt;
    return strings.en;
}
