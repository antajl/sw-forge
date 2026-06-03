#!/usr/bin/env node
/** Find English-like lines inside guide-lang--fr blocks. */
import fs from 'fs';

const html = fs.readFileSync('partials/tabs/guide.html', 'utf8');
const re =
  /<div class="guide-lang guide-lang--fr guide-list">([\s\S]*?)<\/div>\s*<div class="guide-lang guide-lang--ru/g;

const english =
  /\b(the|and|for|with|your|you|this|that|from|when|where|which|what|how|click|hover|open|show|hide|load|search|export|import|share|without|only|need|must|should|will|can|not|all|none|empty|missing|choose|pick|select|build|store|changes|works|same|full|first|second|third|large|small|high|low|above|below|left|right|into|onto|after|before|until|while|because|unless|whether|every|each|both|either|other|another|such|very|just|also|still|already|even|more|most|less|least|much|many|some|any|no|yes|or|if|then|else|than|about|over|under|through|during|between|among|within|across|along|around|against|toward|upon|off|out|up|down|back|away|here|there|now|today|use|using|used|make|makes|made|take|takes|took|get|gets|got|see|sees|saw|know|knows|knew|think|thinks|thought|want|wants|wanted|look|looks|looked|find|finds|found|give|gives|gave|tell|tells|told|ask|asks|asked|try|tries|tried|call|calls|called|keep|keeps|kept|let|lets|put|puts|set|sets|run|runs|ran|move|moves|moved|live|lives|lived|believe|believes|believed|hold|holds|held|bring|brings|brought|happen|happens|happened|write|writes|wrote|provide|provides|provided|sit|sits|sat|stand|stands|stood|lose|loses|lost|pay|pays|paid|meet|meets|met|include|includes|included|continue|continues|continued|learn|learns|learned|change|changes|changed|lead|leads|led|understand|understands|understood|watch|watches|watched|follow|follows|followed|stop|stops|stopped|create|creates|created|speak|speaks|spoke|read|reads|allow|allows|allowed|add|adds|added|spend|spends|spent|grow|grows|grew|open|opens|opened|walk|walks|walked|win|wins|won|offer|offers|offered|remember|remembers|remembered|love|loves|loved|consider|considers|considered|appear|appears|appeared|buy|buys|bought|wait|waits|waited|serve|serves|served|die|dies|died|send|sends|sent|expect|expects|expected|build|builds|built|stay|stays|stayed|fall|falls|fell|cut|cuts|reach|reaches|reached|kill|kills|killed|remain|remains|remained|suggest|suggests|suggested|raise|raises|raised|pass|passes|passed|sell|sells|sold|require|requires|required|report|reports|reported|decide|decides|decided|pull|pulls|pulled|spread|spreads|spread|action|actions|quality|target|reason|plain|sentence|language|globe|icon|header|card|upload|wipes|tweaks|browser|fresh|start|keyboard|mouse|links|application|spreadsheet|style|setup|everyday|control|slider|expert|fields|global|strictness|stage|preset|relaxed|retry|disabled|idea|scoring|guide|engine|formulas|threshold|previews|read-only|tables|grade|numbers|previews|update|live|applies|runes|default|builds|fast|classic|bomber|tank|bruiser|slow|left|list|big|sheet|formula|focus|field|typing|elsewhere|address|bar|current|filters|summary|dump|activate|clickable|row|filtered|table|step|gesture|text|dump|optional|lineups|sample|demo|disappear|own|file|modern|stores|level|crown|leader|combat|account|includes|bonus|export|slots|link|wipe|rules|four|slots|only|when|want|full|fresh|start|on the|in the|at the|to the|of the|for the|with the|by the|from the|is the|are the|was the|were the|be the|been the|being the|have the|has the|had the|having the|do the|does the|did the|doing the|will the|would the|could the|should the|may the|might the|must the|shall the|can the|cannot the|don\'t|doesn\'t|didn\'t|won\'t|wouldn\'t|couldn\'t|shouldn\'t|isn\'t|aren\'t|wasn\'t|weren\'t|hasn\'t|haven\'t|hadn\'t)\b/i;

let blockIdx = 0;
const hits = [];
for (const m of html.matchAll(re)) {
  blockIdx += 1;
  const inner = m[1];
  const lines = inner.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('<') && line.trim().length < 4) continue;
    const text = line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 8) continue;
    if (english.test(text)) {
      hits.push({ block: blockIdx, line: i + 1, text: text.slice(0, 140) });
    }
  }
}
console.log('FR guide blocks:', blockIdx);
console.log('English-like lines:', hits.length);
for (const h of hits.slice(0, 80)) {
  console.log(`[b${h.block}:L${h.line}] ${h.text}`);
}
