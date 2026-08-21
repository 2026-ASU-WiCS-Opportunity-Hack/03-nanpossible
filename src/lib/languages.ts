// Cross-lingual lookup tables so coach search and the language filter work
// when people type in their own language. Hand-rolled (no i18n dependency):
// each canonical English name carries the endonyms and ISO 639-1 codes we
// expect from WIAL's affiliate regions. Matching is case- and
// accent-insensitive.

export type LanguageEntry = {
  name: string;
  aliases: string[];
};

export const languageEntries: LanguageEntry[] = [
  { name: "Arabic", aliases: ["ar", "العربية", "عربي", "arabe", "árabe"] },
  { name: "Cantonese", aliases: ["yue", "粤语", "粵語", "广东话", "廣東話"] },
  {
    name: "Chinese",
    aliases: [
      "zh",
      "中文",
      "汉语",
      "漢語",
      "华语",
      "華語",
      "普通话",
      "国语",
      "國語",
      "中国語",
      "중국어",
      "mandarin",
      "chinois",
      "chino",
      "chinês",
    ],
  },
  { name: "Danish", aliases: ["da", "dansk"] },
  { name: "Dutch", aliases: ["nl", "nederlands", "holandés", "荷兰语"] },
  { name: "English", aliases: ["en", "inglés", "inglês", "anglais", "angielski", "英语", "英語", "영어"] },
  { name: "Finnish", aliases: ["fi", "suomi"] },
  { name: "French", aliases: ["fr", "français", "francés", "francês", "法语", "法語", "프랑스어"] },
  { name: "German", aliases: ["de", "deutsch", "alemán", "alemão", "allemand", "德语", "德語"] },
  { name: "Hindi", aliases: ["hi", "हिन्दी", "हिंदी"] },
  { name: "Indonesian", aliases: ["id", "bahasa indonesia", "印尼语"] },
  { name: "Italian", aliases: ["it", "italiano", "italien", "意大利语"] },
  { name: "Japanese", aliases: ["ja", "日本語", "日本语", "日文", "にほんご", "일본어", "japonés", "japonais", "japonês", "日语", "日語"] },
  { name: "Korean", aliases: ["ko", "한국어", "한국말", "韓国語", "韩语", "韓語", "coréen", "coreano"] },
  { name: "Malay", aliases: ["ms", "bahasa melayu", "melayu", "马来语"] },
  { name: "Norwegian", aliases: ["no", "norsk"] },
  { name: "Polish", aliases: ["pl", "polski", "波兰语"] },
  { name: "Portuguese", aliases: ["pt", "português", "portugués", "portugais", "葡萄牙语"] },
  { name: "Russian", aliases: ["ru", "русский", "russe", "ruso", "俄语", "俄語"] },
  { name: "Spanish", aliases: ["es", "español", "castellano", "espagnol", "西班牙语", "스페인어"] },
  { name: "Swedish", aliases: ["sv", "svenska"] },
  { name: "Thai", aliases: ["th", "ไทย", "ภาษาไทย", "泰语", "泰語"] },
  { name: "Turkish", aliases: ["tr", "türkçe", "turco"] },
  { name: "Vietnamese", aliases: ["vi", "tiếng việt", "tiếng việt nam", "越南语", "越南語"] },
];

// Native-script country/city spellings mapped to the English spelling stored
// on coach rows. Single-word Latin keys only — multi-word phrases never
// survive tokenization; unspaced scripts (CJK/Thai) are matched by
// containment instead.
const placeEndonyms: Record<string, string> = {
  日本: "Japan",
  東京: "Tokyo",
  东京: "Tokyo",
  大阪: "Osaka",
  中国: "China",
  中國: "China",
  北京: "Beijing",
  上海: "Shanghai",
  台湾: "Taiwan",
  台灣: "Taiwan",
  臺灣: "Taiwan",
  台北: "Taipei",
  臺北: "Taipei",
  香港: "Hong Kong",
  한국: "Korea",
  대한민국: "Korea",
  서울: "Seoul",
  ไทย: "Thailand",
  กรุงเทพ: "Bangkok",
  越南: "Vietnam",
  新加坡: "Singapore",
  シンガポール: "Singapore",
  싱가포르: "Singapore",
  马来西亚: "Malaysia",
  馬來西亞: "Malaysia",
  印尼: "Indonesia",
  美国: "United States",
  美國: "United States",
  アメリカ: "United States",
  米国: "United States",
  미국: "United States",
  ドイツ: "Germany",
  deutschland: "Germany",
  フランス: "France",
  ブラジル: "Brazil",
  brasil: "Brazil",
  españa: "Spain",
  méxico: "Mexico",
  polska: "Poland",
  italia: "Italy",
  nederland: "Netherlands",
};

function normalizeToken(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const languageByAlias = new Map<string, string>();

for (const entry of languageEntries) {
  languageByAlias.set(normalizeToken(entry.name), entry.name);

  for (const alias of entry.aliases) {
    languageByAlias.set(normalizeToken(alias), entry.name);
  }
}

const placeByEndonym = new Map<string, string>();

for (const [endonym, english] of Object.entries(placeEndonyms)) {
  placeByEndonym.set(normalizeToken(endonym), english);
}

export function canonicalLanguageName(input: string | null | undefined) {
  if (!input?.trim()) {
    return null;
  }

  return languageByAlias.get(normalizeToken(input)) ?? null;
}

const NON_ASCII_PATTERN = /[^\x00-\x7f]/;

// English equivalents for a single query token. 1–2 char ASCII tokens are
// skipped: ISO codes double as common words ("it", "no", "de"). Unspaced
// scripts arrive as one long token, so non-ASCII aliases also match by
// containment ("中文教练" → Chinese).
export function crossLingualExpansions(term: string) {
  const normalized = normalizeToken(term);

  if (!normalized) {
    return [] satisfies string[];
  }

  const results = new Set<string>();

  if (!/^[a-z0-9]{1,2}$/.test(normalized)) {
    const language = languageByAlias.get(normalized);
    if (language) {
      results.add(language);
    }

    const place = placeByEndonym.get(normalized);
    if (place) {
      results.add(place);
    }
  }

  if (NON_ASCII_PATTERN.test(normalized)) {
    for (const [alias, name] of languageByAlias) {
      if (NON_ASCII_PATTERN.test(alias) && normalized.includes(alias)) {
        results.add(name);
      }
    }

    for (const [endonym, name] of placeByEndonym) {
      if (NON_ASCII_PATTERN.test(endonym) && normalized.includes(endonym)) {
        results.add(name);
      }
    }
  }

  return [...results];
}
