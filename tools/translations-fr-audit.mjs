import fs from 'fs';

function objectKeys(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const block = text.slice(start + 1, end);
  return [...block.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
}

function extractValues(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const block = text.slice(start + 1, end);
  const out = {};
  const re = /^\s+(\w+):\s*([\s\S]*?)(?=,\n\s+\w+:|\n\s*\})/gm;
  let m;
  while ((m = re.exec(block)) !== null) {
    let v = m[2].trim();
    if (v.endsWith(',')) v = v.slice(0, -1).trim();
    if (
      (v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"'))
    ) {
      v = v.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, '\n');
    }
    out[m[1]] = v;
  }
  return out;
}

const en = extractValues(fs.readFileSync('js/core/translations-en.js', 'utf8'));
const fr = extractValues(fs.readFileSync('js/core/translations-fr.js', 'utf8'));

const enKeys = Object.keys(en);
const missing = enKeys.filter((k) => !fr[k]);
const identical = enKeys.filter((k) => fr[k] && fr[k] === en[k]);
const englishWord =
  /\b(the|and|for|with|your|hover|click|open|table|dashboard|score|verdict|grind|sell|keep|missing|needs|breakdown|inventory|storage|incomplete|skill|plan|attention|from|when|this|that|only|all|none|empty|load|save|share|filter|search|export|reset|clear|select|deselect|optional|expert|rules|engine|roles|stage|early|mid|late|power|slot|main|sub|stat|set|grade|legend|hero|rare|ancient|efficiency|potential|preview|tooltip|hint|banner|lead|title|desc|label|btn|tab|panel|section|row|column|header|footer|guide|changelog|roadmap|release|update|version|build|demo|upload|download|privacy|donate|support|language|theme|dark|light|monster|monsters|team|teams|artifact|artifacts|relic|relics|rune|runes|gear|roster|planner|queue|stuck|favorite|food|tag|tags|bulk|mark|storage|equipped|inventory|location|category|type|attribute|role|synergy|synergies|threshold|constant|formula|policy|strict|simple|god|high|duo|roll|flat|percent|anchor|rescue|line|grid|block|pattern|turn|cooldown|awaken|awakening|natural|nat|skill-up|devil|maxed|upgradeable|passive|leader|totem|combat|speed|base|total|current|potential|sort|asc|desc|csv|json|swex|swop|forge|ingame|com2us|rating|community|spreadsheet|reroll|enchant|prefix|innate|flat|subs|meule|gemme|reapp|reappraisal|finish|upgrade|power|level|durability|wearer|secondary|primary|main|subs|icon|portrait|name|search|toolbar|drawer|popover|done|apply|cancel|close|copy|copied|address|wallet|crypto|network|card|payment|platform|creator|international|direct|transfer|peer|intermediary|configured|method|works|best|choose|please|ensure|using|trc|usdt|apple|pay|via|boosty|lava|top|gateway|universal|fast|convenient|various|methods|dedicated|supports|payments|ideal|prefer|without|address|not|yet|configured|options|development|free|updated|help|keep|tool|thank|support|disclaimer|unofficial|fan|made|com2u|trademarks|respect|rights|owners|data|stays|browser|except|optional|share|worker|local|only|assets|cdn|fallback|manifest|bundled|index|schema|meta|fetch|fresh|demo|dataset|slot|database|profile|link|url|query|param|read|only|view|banner|mentor|review|equipped|split|mode|export|all|selected|content|nothing|copied|send|compare|builds|public|private|team|set|lineup|seed|sample|sync|remove|real|load|empty|import|save|delete|rename|duplicate|side|by|side|compare|diff|verdict|role|content|tags|presets|rta|siege|toa|filter|manual|food|hexagram|fusion|tracker|builder|lite|hint|inventory|archetype|open|table|depth|box|score|graph|chart|histogram|bucket|median|average|avg|distribution|toggle|kind|runes|artifacts|verdict|grade|type|role|attribute|ingame|forge|panel|empty|state|upload|prompt|refresh|change|rules|preference|localStorage|key|kind|default|runes|six|panels|respect|filters|full|list|parse|account|gear|coefficient|weights|calibration|breakdown|diagnostic|surface|elite|metric|chart|only|not|shown|grid|column|sort|slots|within|hover|tooltip|reason|text|no|reason|filter|more|filters|clear|all|reset|ancient|only|export|csv|toolbar|section|actions|display|search|placeholder|drawer|title|done|chip|badge|mark|bulk|select|visible|deselect|overview|tiles|detail|card|list|table|hub|pane|skill|plan|queue|stuck|cd|goals|priority|nat|filter|all|naturals|only|plus|exclude|hide|needs|maxed|all|skills|second|awakening|toolbar|field|filters|monsters|name|en|ru|fr|inline|guide|player|docs|tab|step|progression|evaluation|tips|start|shipped|roadmap|releases|updates|app|settings|database|slots|desc|title|wrap|cards|sync|locale|otherwise|only|title|description|language|changes|theme|a11y|header|lang|menu|share|equipped|only|profile|btn|split|labels|footer|version|build|min|lvl|grade|range|from|to|group|keepers|queue|attention|export|summary|copy|compact|expand|collapse|progression|details|view|metric|contrib|tpl|pts|cap|eff|median|caption|filtered|pct|buckets|histogram|top|spd|title|legend|cur|pot|potential|current|sort|aria|set|select|radar|hint|stack|verdict|slot|share|unified|block|dist|aria|artifact|empty|no|artifacts|kind|tabs|runes|artifacts|hub|runes|monsters|dashboard|table|rules|expert|hint|optional|page|lead|subtab|subtabs|aria|shipped|roadmap|changelog|settings|open|app|language|select|value|preserved|game|stage|visual|classes|recommended|analyze|prompt|lead|secondary|drag|hint|cta|choose|json|file|clear|saved|privacy|note|upload|description|load|your|swex|donate|short|title|aria|dialog|lead|section|boosty|lava|crypto|prefix|network|hint|empty|copy|address|copied|close|footer|disclaimer|version|label)\b/i;

const likelyEnglish = enKeys.filter((k) => {
  const v = fr[k];
  if (!v) return false;
  return englishWord.test(v);
});

console.log(JSON.stringify({ missing, identicalCount: identical.length, identical: identical.slice(0, 50), likelyEnglishCount: likelyEnglish.length, likelyEnglish: likelyEnglish.map((k) => ({ k, en: en[k].slice(0, 80), fr: fr[k].slice(0, 80) })).slice(0, 100) }, null, 2));
