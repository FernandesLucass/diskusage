export const Translations = {
    pt: {
        used: 'usado',
        freeOf: 'livres de',
        noDisks: 'Nenhum disco encontrado',
        errorLoad: 'Erro ao carregar discos',
        diskOrder: 'Ordem dos Discos',
        diskOrderDesc: 'Defina a ordem em que os discos aparecem no painel.',
        language: 'Idioma (Language)',
        languageDesc: 'Escolha o idioma de exibição da extensão.',
        langAuto: 'Automático (Sistema)',
        langPT: 'Português',
        langEN: 'English'
    },
    en: {
        used: 'used',
        freeOf: 'free of',
        noDisks: 'No disks found',
        errorLoad: 'Error loading disks',
        diskOrder: 'Disk Order',
        diskOrderDesc: 'Set the order in which disks appear in the panel.',
        language: 'Language',
        languageDesc: 'Choose the extension display language.',
        langAuto: 'Automatic (System)',
        langPT: 'Português',
        langEN: 'English'
    }
};

export function getTranslation(settings) {
    let lang = settings.get_string('language');
    
    // Se estiver no automático, puxa a linguagem do Ubuntu/GNOME do usuário
    if (lang === 'auto') {
        const systemLang = Intl.DateTimeFormat().resolvedOptions().locale;
        lang = systemLang.startsWith('pt') ? 'pt' : 'en';
    }
    
    return Translations[lang] || Translations.en;
}