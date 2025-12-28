
export const AI_PACK_CONTENT = {
  tools: [
    {
      category: "Recherche de Sources",
      items: [
        { name: "Consensus", desc: "Moteur de recherche IA qui répond à partir d'articles scientifiques réels.", url: "https://consensus.app" },
        { name: "Perplexity AI", desc: "Idéal pour obtenir des sources citées en temps réel sur n'importe quel sujet.", url: "https://perplexity.ai" },
        { name: "Elicit", desc: "Analyse des milliers de papiers pour extraire les données clés automatiquement.", url: "https://elicit.com" }
      ]
    },
    {
      category: "Rédaction & Style",
      items: [
        { name: "Claude.ai", desc: "La meilleure IA pour la rédaction académique (style plus humain que ChatGPT).", url: "https://claude.ai" },
        { name: "DeepL Write", desc: "Pour corriger la grammaire et le style sans changer le sens technique.", url: "https://deepl.com/write" },
        { name: "Grammarly", desc: "Indispensable pour la rédaction d'articles en anglais.", url: "https://grammarly.com" }
      ]
    },
    {
      category: "Analyse de PDF",
      items: [
        { name: "ChatPDF", desc: "Discutez avec vos articles de recherche pour extraire les limites d'une étude.", url: "https://chatpdf.com" },
        { name: "Humata AI", desc: "Analyse ultra-rapide de longs documents techniques.", url: "https://humata.ai" }
      ]
    }
  ],
  prompts: [
    {
      title: "Rédaction d'une Introduction",
      prompt: "Agis comme un expert en rédaction scientifique. Aide-moi à structurer l'introduction de ma thèse sur [SUJET]. Utilise la méthode de l'entonnoir : commence par le contexte global, puis les enjeux spécifiques, et termine par la problématique et l'annonce du plan. Le ton doit être formel et académique."
    },
    {
      title: "Reformulation Académique",
      prompt: "Reformule le texte suivant pour un article de revue Q1. Évite les répétitions, utilise un vocabulaire précis et assure-toi que les transitions logiques sont fluides. Texte : [COLLER VOTRE TEXTE ICI]"
    },
    {
      title: "Extraction de Limites",
      prompt: "Analyse ce résumé d'article et identifie les 3 limites méthodologiques principales ainsi que les perspectives de recherche suggérées par les auteurs. Sois critique et rigoureux."
    },
    {
      title: "Génération de Plan de Mémoire",
      prompt: "Propose un plan détaillé pour un mémoire de Master sur le thème [SUJET]. Le plan doit inclure une partie théorique, une partie méthodologique et une partie analyse des résultats. Suggère également des titres de sous-chapitres percutants."
    }
  ],
  guides: [
    { title: "Configuration Zotero + IA", desc: "Comment lier vos sources à Claude pour un gain de temps de 50%." },
    { title: "Éviter le Plagiat IA", desc: "Les 5 règles d'or pour utiliser l'IA sans risquer d'être sanctionné." }
  ]
};
