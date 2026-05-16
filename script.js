/* ═══════════════════════════════════════════════════════
   BACKEND — GOOGLE APPS SCRIPT
   ───────────────────────────────────────────────────────
   COMO CONFIGURAR (5 minutos):
   1. Acesse: https://sheets.new  → crie uma planilha
   2. Menu Extensões → Apps Script → cole o código abaixo:
   ─────────────────────────────────────────────────────────
   function doPost(e) {
     const data = JSON.parse(e.postData.contents);
     const sheet = SpreadsheetApp.getActiveSpreadsheet()
       .getSheetByName('Palpites') || 
       SpreadsheetApp.getActiveSpreadsheet().insertSheet('Palpites');
     
     if (data.action === 'save_score') {
       const rows = sheet.getDataRange().getValues();
       const idx = rows.findIndex(r => r[0]===data.user && r[1]===data.match_id);
       const row = [data.user, data.match_id, data.score_home, data.score_away, new Date().toISOString()];
       if (idx > 0) sheet.getRange(idx+1, 1, 1, 5).setValues([row]);
       else sheet.appendRow(row);
     }
     
     return ContentService
       .createTextOutput(JSON.stringify({ok:true}))
       .setMimeType(ContentService.MimeType.JSON);
   }
   
   function doGet(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet()
       .getSheetByName('Palpites');
     if (!sheet) return ContentService.createTextOutput('{}');
     const [, ...rows] = sheet.getDataRange().getValues();
     const scores = {};
     rows.forEach(([user, match_id, h, a]) => {
       if (!scores[user]) scores[user] = {};
       scores[user][match_id] = { h: String(h), a: String(a) };
     });
     return ContentService
       .createTextOutput(JSON.stringify(scores))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ─────────────────────────────────────────────────────────
   3. Clique em "Implantar" → "Nova implantação"
      Tipo: App da Web | Acesso: Qualquer pessoa
   4. Copie a URL e cole em GOOGLE_SCRIPT_URL abaixo.
═══════════════════════════════════════════════════════ */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9d5o6av_Z3VxwvZ4qbLom0uaRgzp2mBbciQuCKzwI3KoxdmBK6fNoRkEUZHzF42TdTQ/exec'; // ← URL do Apps Script

/* ═══════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════ */
const LOCK_DATE   = new Date('2026-06-06T23:59:59-03:00');
const STORAGE_KEY = 'bolao2026_v1';

// Delay em ms antes de abrir o popup após completar rodada
const POPUP_DELAY_MS = 3000;

/* ═══════════════════════════════════════════════════════
   GROUPS & GAMES DATA
═══════════════════════════════════════════════════════ */
const GROUPS = {
  A:{teams:[{f:'🇲🇽',n:'México'},{f:'🇿🇦',n:'África do Sul'},{f:'🇰🇷',n:'Coreia do Sul'},{f:'🇨🇿',n:'República Tcheca'}]},
  B:{teams:[{f:'🇨🇦',n:'Canadá'},{f:'🇧🇦',n:'Bósnia'},{f:'🇶🇦',n:'Catar'},{f:'🇨🇭',n:'Suíça'}]},
  C:{teams:[{f:'🇧🇷',n:'Brasil'},{f:'🇲🇦',n:'Marrocos'},{f:'🇭🇹',n:'Haiti'},{f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'}]},
  D:{teams:[{f:'🇺🇸',n:'EUA'},{f:'🇵🇾',n:'Paraguai'},{f:'🇦🇺',n:'Austrália'},{f:'🇹🇷',n:'Turquia'}]},
  E:{teams:[{f:'🇩🇪',n:'Alemanha'},{f:'🇨🇼',n:'Curaçao'},{f:'🇨🇮',n:'Costa do Marfim'},{f:'🇪🇨',n:'Equador'}]},
  F:{teams:[{f:'🇳🇱',n:'Holanda'},{f:'🇯🇵',n:'Japão'},{f:'🇸🇪',n:'Suécia'},{f:'🇹🇳',n:'Tunísia'}]},
  G:{teams:[{f:'🇧🇪',n:'Bélgica'},{f:'🇪🇬',n:'Egito'},{f:'🇮🇷',n:'Irã'},{f:'🇳🇿',n:'Nova Zelândia'}]},
  H:{teams:[{f:'🇪🇸',n:'Espanha'},{f:'🇨🇻',n:'Cabo Verde'},{f:'🇸🇦',n:'Arábia Saudita'},{f:'🇺🇾',n:'Uruguai'}]},
  I:{teams:[{f:'🇫🇷',n:'França'},{f:'🇸🇳',n:'Senegal'},{f:'🇮🇶',n:'Iraque'},{f:'🇳🇴',n:'Noruega'}]},
  J:{teams:[{f:'🇦🇷',n:'Argentina'},{f:'🇩🇿',n:'Argélia'},{f:'🇦🇹',n:'Áustria'},{f:'🇯🇴',n:'Jordânia'}]},
  K:{teams:[{f:'🇵🇹',n:'Portugal'},{f:'🇨🇩',n:'RD Congo'},{f:'🇺🇿',n:'Uzbequistão'},{f:'🇨🇴',n:'Colômbia'}]},
  L:{teams:[{f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},{f:'🇭🇷',n:'Croácia'},{f:'🇬🇭',n:'Gana'},{f:'🇵🇦',n:'Panamá'}]},
};

const STIMG = {
  'Estádio Azteca':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Azteca_2016.jpg/640px-Azteca_2016.jpg',
  'Estádio Akron':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Estadio_Akron_%282018%29.jpg/640px-Estadio_Akron_%282018%29.jpg',
  'BMO Field':'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/BMO_Field_%28April_2016%29.jpg/640px-BMO_Field_%28April_2016%29.jpg',
  "Levi's Stadium":'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Levi%27s_Stadium_aerial_-_2013.jpg/640px-Levi%27s_Stadium_aerial_-_2013.jpg',
  'MetLife Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/MetLife_Stadium_-_aerial_view.jpg/640px-MetLife_Stadium_-_aerial_view.jpg',
  'Gillette Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Gillette_Stadium_-_2012.jpg/640px-Gillette_Stadium_-_2012.jpg',
  'SoFi Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/SoFi_Stadium_aerial_2021.jpg/640px-SoFi_Stadium_aerial_2021.jpg',
  'BC Place':'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/BC_Place_Oct_2011.jpg/640px-BC_Place_Oct_2011.jpg',
  'NRG Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/NRG_Stadium.jpg/640px-NRG_Stadium.jpg',
  'Lincoln Financial Field':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Lincoln_Financial_Field_%282013%29.jpg/640px-Lincoln_Financial_Field_%282013%29.jpg',
  'AT&T Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Cowboys_Stadium_%28Texas_Bowl%29.jpg/640px-Cowboys_Stadium_%28Texas_Bowl%29.jpg',
  'Estadio BBVA':'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Estadio_BBVA_Bancomer.jpg/640px-Estadio_BBVA_Bancomer.jpg',
  'Lumen Field':'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Seahawks_vs_Bears_2013-01-06_%28Lumen_Field%29.jpg/640px-Seahawks_vs_Bears_2013-01-06_%28Lumen_Field%29.jpg',
  'Mercedes-Benz Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mercedes-Benz_Stadium_render.jpg/640px-Mercedes-Benz_Stadium_render.jpg',
  'Hard Rock Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Hard_Rock_Stadium_2016.jpg/640px-Hard_Rock_Stadium_2016.jpg',
  'Arrowhead Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Arrowhead_Stadium_2013.jpg/640px-Arrowhead_Stadium_2013.jpg',
  'Camping World Stadium':'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Camping_World_Stadium_2016.jpg/640px-Camping_World_Stadium_2016.jpg',
};

const MATCHES = {
  A:[
    {r:1,games:[
      {id:'A1R1G1',h:{f:'🇲🇽',n:'México'},a:{f:'🇿🇦',n:'África do Sul'},dt:'11/Jun (Qui)',tm:'16h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
      {id:'A1R1G2',h:{f:'🇰🇷',n:'Coreia do Sul'},a:{f:'🇨🇿',n:'República Tcheca'},dt:'11/Jun (Qui)',tm:'23h',st:'Estádio Akron',ci:'Guadalajara, MEX'},
    ]},
    {r:2,games:[
      {id:'A1R2G1',h:{f:'🇲🇽',n:'México'},a:{f:'🇰🇷',n:'Coreia do Sul'},dt:'16/Jun (Ter)',tm:'23h',st:'Estádio Akron',ci:'Guadalajara, MEX'},
      {id:'A1R2G2',h:{f:'🇨🇿',n:'República Tcheca'},a:{f:'🇿🇦',n:'África do Sul'},dt:'17/Jun (Qua)',tm:'16h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
    {r:3,games:[
      {id:'A1R3G1',h:{f:'🇲🇽',n:'México'},a:{f:'🇨🇿',n:'República Tcheca'},dt:'24/Jun (Qua)',tm:'13h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
      {id:'A1R3G2',h:{f:'🇿🇦',n:'África do Sul'},a:{f:'🇰🇷',n:'Coreia do Sul'},dt:'24/Jun (Qua)',tm:'13h',st:'Estádio Akron',ci:'Guadalajara, MEX'},
    ]},
  ],
  B:[
    {r:1,games:[
      {id:'B1R1G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇧🇦',n:'Bósnia'},dt:'12/Jun (Sex)',tm:'16h',st:'BMO Field',ci:'Toronto, CAN'},
      {id:'B1R1G2',h:{f:'🇶🇦',n:'Catar'},a:{f:'🇨🇭',n:'Suíça'},dt:'13/Jun (Sáb)',tm:'16h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
    ]},
    {r:2,games:[
      {id:'B1R2G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇶🇦',n:'Catar'},dt:'17/Jun (Qua)',tm:'19h',st:'BC Place',ci:'Vancouver, CAN'},
      {id:'B1R2G2',h:{f:'🇨🇭',n:'Suíça'},a:{f:'🇧🇦',n:'Bósnia'},dt:'17/Jun (Qua)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
    ]},
    {r:3,games:[
      {id:'B1R3G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇨🇭',n:'Suíça'},dt:'24/Jun (Qua)',tm:'17h',st:'BMO Field',ci:'Toronto, CAN'},
      {id:'B1R3G2',h:{f:'🇧🇦',n:'Bósnia'},a:{f:'🇶🇦',n:'Catar'},dt:'24/Jun (Qua)',tm:'17h',st:'BC Place',ci:'Vancouver, CAN'},
    ]},
  ],
  C:[
    {r:1,games:[
      {id:'C1R1G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'🇲🇦',n:'Marrocos'},dt:'13/Jun (Sáb)',tm:'19h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'C1R1G2',h:{f:'🇭🇹',n:'Haiti'},a:{f:'es',n:'Escócia'},dt:'13/Jun (Sáb)',tm:'22h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
    {r:2,games:[
      {id:'C1R2G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'🇭🇹',n:'Haiti'},dt:'19/Jun (Sex)',tm:'19h',st:'Camping World Stadium',ci:'Orlando, EUA'},
      {id:'C1R2G2',h:{f:'es',n:'Escócia'},a:{f:'🇲🇦',n:'Marrocos'},dt:'19/Jun (Sex)',tm:'22h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
    ]},
    {r:3,games:[
      {id:'C1R3G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'es',n:'Escócia'},dt:'24/Jun (Qua)',tm:'21h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'C1R3G2',h:{f:'🇲🇦',n:'Marrocos'},a:{f:'🇭🇹',n:'Haiti'},dt:'24/Jun (Qua)',tm:'21h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
  ],
  D:[
    {r:1,games:[
      {id:'D1R1G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇵🇾',n:'Paraguai'},dt:'12/Jun (Sex)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'D1R1G2',h:{f:'🇦🇺',n:'Austrália'},a:{f:'🇹🇷',n:'Turquia'},dt:'14/Jun (Dom)',tm:'01h',st:'BC Place',ci:'Vancouver, CAN'},
    ]},
    {r:2,games:[
      {id:'D1R2G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇦🇺',n:'Austrália'},dt:'16/Jun (Ter)',tm:'22h',st:'Lumen Field',ci:'Seattle, EUA'},
      {id:'D1R2G2',h:{f:'🇹🇷',n:'Turquia'},a:{f:'🇵🇾',n:'Paraguai'},dt:'17/Jun (Qua)',tm:'13h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
    {r:3,games:[
      {id:'D1R3G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇹🇷',n:'Turquia'},dt:'25/Jun (Qui)',tm:'13h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'D1R3G2',h:{f:'🇵🇾',n:'Paraguai'},a:{f:'🇦🇺',n:'Austrália'},dt:'25/Jun (Qui)',tm:'13h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
  ],
  E:[
    {r:1,games:[
      {id:'E1R1G1',h:{f:'🇩🇪',n:'Alemanha'},a:{f:'🇨🇼',n:'Curaçao'},dt:'14/Jun (Dom)',tm:'14h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'E1R1G2',h:{f:'🇨🇮',n:'Costa do Marfim'},a:{f:'🇪🇨',n:'Equador'},dt:'14/Jun (Dom)',tm:'20h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:2,games:[
      {id:'E1R2G1',h:{f:'🇩🇪',n:'Alemanha'},a:{f:'🇨🇮',n:'Costa do Marfim'},dt:'18/Jun (Qui)',tm:'16h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'E1R2G2',h:{f:'🇪🇨',n:'Equador'},a:{f:'🇨🇼',n:'Curaçao'},dt:'18/Jun (Qui)',tm:'19h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
    {r:3,games:[
      {id:'E1R3G1',h:{f:'🇩🇪',n:'Alemanha'},a:{f:'🇪🇨',n:'Equador'},dt:'25/Jun (Qui)',tm:'17h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'E1R3G2',h:{f:'🇨🇼',n:'Curaçao'},a:{f:'🇨🇮',n:'Costa do Marfim'},dt:'25/Jun (Qui)',tm:'17h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
  ],
  F:[
    {r:1,games:[
      {id:'F1R1G1',h:{f:'🇳🇱',n:'Holanda'},a:{f:'🇯🇵',n:'Japão'},dt:'14/Jun (Dom)',tm:'17h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'F1R1G2',h:{f:'🇸🇪',n:'Suécia'},a:{f:'🇹🇳',n:'Tunísia'},dt:'14/Jun (Dom)',tm:'23h',st:'Estadio BBVA',ci:'Monterrey, MEX'},
    ]},
    {r:2,games:[
      {id:'F1R2G1',h:{f:'🇳🇱',n:'Holanda'},a:{f:'🇸🇪',n:'Suécia'},dt:'18/Jun (Qui)',tm:'22h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
      {id:'F1R2G2',h:{f:'🇹🇳',n:'Tunísia'},a:{f:'🇯🇵',n:'Japão'},dt:'19/Jun (Sex)',tm:'13h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:3,games:[
      {id:'F1R3G1',h:{f:'🇳🇱',n:'Holanda'},a:{f:'🇹🇳',n:'Tunísia'},dt:'25/Jun (Qui)',tm:'21h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'F1R3G2',h:{f:'🇯🇵',n:'Japão'},a:{f:'🇸🇪',n:'Suécia'},dt:'25/Jun (Qui)',tm:'21h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
    ]},
  ],
  G:[
    {r:1,games:[
      {id:'G1R1G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇪🇬',n:'Egito'},dt:'15/Jun (Seg)',tm:'16h',st:'Lumen Field',ci:'Seattle, EUA'},
      {id:'G1R1G2',h:{f:'🇮🇷',n:'Irã'},a:{f:'🇳🇿',n:'Nova Zelândia'},dt:'15/Jun (Seg)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
    ]},
    {r:2,games:[
      {id:'G1R2G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇮🇷',n:'Irã'},dt:'19/Jun (Sex)',tm:'16h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'G1R2G2',h:{f:'🇳🇿',n:'Nova Zelândia'},a:{f:'🇪🇬',n:'Egito'},dt:'20/Jun (Sáb)',tm:'16h',st:'BMO Field',ci:'Toronto, CAN'},
    ]},
    {r:3,games:[
      {id:'G1R3G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇳🇿',n:'Nova Zelândia'},dt:'26/Jun (Sex)',tm:'13h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'G1R3G2',h:{f:'🇪🇬',n:'Egito'},a:{f:'🇮🇷',n:'Irã'},dt:'26/Jun (Sex)',tm:'13h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
  ],
  H:[
    {r:1,games:[
      {id:'H1R1G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇨🇻',n:'Cabo Verde'},dt:'15/Jun (Seg)',tm:'13h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
      {id:'H1R1G2',h:{f:'🇸🇦',n:'Arábia Saudita'},a:{f:'🇺🇾',n:'Uruguai'},dt:'15/Jun (Seg)',tm:'19h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
    ]},
    {r:2,games:[
      {id:'H1R2G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇸🇦',n:'Arábia Saudita'},dt:'20/Jun (Sáb)',tm:'19h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'H1R2G2',h:{f:'🇺🇾',n:'Uruguai'},a:{f:'🇨🇻',n:'Cabo Verde'},dt:'20/Jun (Sáb)',tm:'22h',st:'NRG Stadium',ci:'Houston, EUA'},
    ]},
    {r:3,games:[
      {id:'H1R3G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇺🇾',n:'Uruguai'},dt:'26/Jun (Sex)',tm:'17h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
      {id:'H1R3G2',h:{f:'🇨🇻',n:'Cabo Verde'},a:{f:'🇸🇦',n:'Arábia Saudita'},dt:'26/Jun (Sex)',tm:'17h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
  ],
  I:[
    {r:1,games:[
      {id:'I1R1G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇸🇳',n:'Senegal'},dt:'16/Jun (Ter)',tm:'16h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'I1R1G2',h:{f:'🇮🇶',n:'Iraque'},a:{f:'🇳🇴',n:'Noruega'},dt:'16/Jun (Ter)',tm:'19h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
    {r:2,games:[
      {id:'I1R2G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇮🇶',n:'Iraque'},dt:'21/Jun (Dom)',tm:'16h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
      {id:'I1R2G2',h:{f:'🇳🇴',n:'Noruega'},a:{f:'🇸🇳',n:'Senegal'},dt:'21/Jun (Dom)',tm:'19h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
    {r:3,games:[
      {id:'I1R3G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇳🇴',n:'Noruega'},dt:'26/Jun (Sex)',tm:'21h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'I1R3G2',h:{f:'🇸🇳',n:'Senegal'},a:{f:'🇮🇶',n:'Iraque'},dt:'26/Jun (Sex)',tm:'21h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
  ],
  J:[
    {r:1,games:[
      {id:'J1R1G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇩🇿',n:'Argélia'},dt:'16/Jun (Ter)',tm:'22h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
      {id:'J1R1G2',h:{f:'🇦🇹',n:'Áustria'},a:{f:'🇯🇴',n:'Jordânia'},dt:'17/Jun (Qua)',tm:'01h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
    ]},
    {r:2,games:[
      {id:'J1R2G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇦🇹',n:'Áustria'},dt:'21/Jun (Dom)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'J1R2G2',h:{f:'🇯🇴',n:'Jordânia'},a:{f:'🇩🇿',n:'Argélia'},dt:'22/Jun (Seg)',tm:'13h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:3,games:[
      {id:'J1R3G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇯🇴',n:'Jordânia'},dt:'27/Jun (Sáb)',tm:'13h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'J1R3G2',h:{f:'🇩🇿',n:'Argélia'},a:{f:'🇦🇹',n:'Áustria'},dt:'27/Jun (Sáb)',tm:'13h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
    ]},
  ],
  K:[
    {r:1,games:[
      {id:'K1R1G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇨🇩',n:'RD Congo'},dt:'17/Jun (Qua)',tm:'14h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'K1R1G2',h:{f:'🇺🇿',n:'Uzbequistão'},a:{f:'🇨🇴',n:'Colômbia'},dt:'17/Jun (Qua)',tm:'23h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
    ]},
    {r:2,games:[
      {id:'K1R2G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇺🇿',n:'Uzbequistão'},dt:'22/Jun (Seg)',tm:'16h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'K1R2G2',h:{f:'🇨🇴',n:'Colômbia'},a:{f:'🇨🇩',n:'RD Congo'},dt:'22/Jun (Seg)',tm:'19h',st:'AT&T Stadium',ci:'Dallas, EUA'},
    ]},
    {r:3,games:[
      {id:'K1R3G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇨🇴',n:'Colômbia'},dt:'27/Jun (Sáb)',tm:'17h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'K1R3G2',h:{f:'🇨🇩',n:'RD Congo'},a:{f:'🇺🇿',n:'Uzbequistão'},dt:'27/Jun (Sáb)',tm:'17h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
    ]},
  ],
  L:[
    {r:1,games:[
      {id:'L1R1G1',h:{f:'in',n:'Inglaterra'},a:{f:'🇭🇷',n:'Croácia'},dt:'17/Jun (Qua)',tm:'17h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'L1R1G2',h:{f:'🇬🇭',n:'Gana'},a:{f:'🇵🇦',n:'Panamá'},dt:'17/Jun (Qua)',tm:'20h',st:'BMO Field',ci:'Toronto, CAN'},
    ]},
    {r:2,games:[
      {id:'L1R2G1',h:{f:'in',n:'Inglaterra'},a:{f:'🇬🇭',n:'Gana'},dt:'22/Jun (Seg)',tm:'22h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'L1R2G2',h:{f:'🇵🇦',n:'Panamá'},a:{f:'🇭🇷',n:'Croácia'},dt:'23/Jun (Ter)',tm:'16h',st:'Estadio BBVA',ci:'Monterrey, MEX'},
    ]},
    {r:3,games:[
      {id:'L1R3G1',h:{f:'in',n:'Inglaterra'},a:{f:'🇵🇦',n:'Panamá'},dt:'27/Jun (Sáb)',tm:'21h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'L1R3G2',h:{f:'🇭🇷',n:'Croácia'},a:{f:'🇬🇭',n:'Gana'},dt:'27/Jun (Sáb)',tm:'21h',st:'BMO Field',ci:'Toronto, CAN'},
    ]},
  ],
};

const ALL_IDS = [];
Object.values(MATCHES).forEach(rds=>rds.forEach(rd=>rd.games.forEach(g=>ALL_IDS.push(g.id))));

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */
let S = {user:null, group:null, round:1, rounds:[]};
let autoPopupTimer = null;    // timer do popup de 3s
let popupMode = null;         // 'round' | 'group' | 'finish'
let syncQueue = [];           // fila de sincronização offline
let isSyncing = false;

/* ═══════════════════════════════════════════════════════
   STORAGE LOCAL (offline-safe, instantâneo)
═══════════════════════════════════════════════════════ */
function store(){return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}
function save(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}

function hashPw(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h)+s.charCodeAt(i)|0;return h.toString(36)}

function getUsers(){return store().users||{}}
function saveUsers(u){const d=store();d.users=u;save(d)}
function getScores(){return store().scores||{}}
function saveScores(sc){const d=store();d.scores=sc;save(d)}

/* session persistence */
function getSession(){return localStorage.getItem(STORAGE_KEY+'_session')||null}
function saveSession(name){localStorage.setItem(STORAGE_KEY+'_session',name)}
function clearSession(){localStorage.removeItem(STORAGE_KEY+'_session')}

/* sync queue persistence (para não perder dados offline) */
function getSyncQueue(){return JSON.parse(localStorage.getItem(STORAGE_KEY+'_queue')||'[]')}
function saveSyncQueue(q){localStorage.setItem(STORAGE_KEY+'_queue',JSON.stringify(q))}

/* ═══════════════════════════════════════════════════════
   BACKEND — GOOGLE APPS SCRIPT SYNC
═══════════════════════════════════════════════════════ */
function setSyncStatus(state, msg) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = 'sync-status ' + state;
  el.textContent = msg;
}

async function syncToCloud(user, matchId, h, a) {
  if (!GOOGLE_SCRIPT_URL) return; // sem URL configurada, só local

  const payload = {action:'save_score', user, match_id:matchId, score_home:h, score_away:a};
  
  // Adiciona na fila
  const q = getSyncQueue();
  const existing = q.findIndex(x => x.user === user && x.match_id === matchId);
  if (existing >= 0) q[existing] = payload; else q.push(payload);
  saveSyncQueue(q);

  processQueue();
}

async function processQueue() {
  if (isSyncing || !GOOGLE_SCRIPT_URL) return;
  const q = getSyncQueue();
  if (!q.length) return;

  isSyncing = true;
  setSyncStatus('syncing', '🔄 Sincronizando...');

  for (let i = 0; i < q.length; i++) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method:'POST',
        // Usar text/plain puro evita bloqueios de CORS do Google Apps Script
        headers:{'Content-Type': 'text/plain'}, 
        body:JSON.stringify(q[i])
      });
      q.splice(i, 1);
      i--;
      saveSyncQueue(q);
    } catch (err) {
      console.warn('[Bolão] Falha ao sincronizar, tentará novamente:', err.message);
      break;
    }
  }

  isSyncing = false;

  if (getSyncQueue().length === 0) {
    setSyncStatus('synced', '✔ Sincronizado');
    setTimeout(() => setSyncStatus('', ''), 3000);
  } else {
    setSyncStatus('error', '⚠ Sem conexão — salvo localmente');
  }
}

// Ao voltar online, processa a fila
window.addEventListener('online', () => {
  setSyncStatus('syncing', '🔄 Reconectado, sincronizando...');
  processQueue();
});

// Ao carregar a página, carrega dados do cloud e mescla
async function loadFromCloud() {
  if (!GOOGLE_SCRIPT_URL) return;
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL + '?action=get_scores');
    if (!res.ok) return;
    const cloudScores = await res.json();
    // Mescla com local — cloud vence conflitos
    const local = getScores();
    const merged = {...local};
    Object.entries(cloudScores).forEach(([user, games]) => {
      if (!merged[user]) merged[user] = {};
      Object.assign(merged[user], games);
    });
    saveScores(merged);
    renderPlayersLogin();
    if (S.user) renderGroupsGrid && renderGroupsGrid();
  } catch(e) {
    console.warn('[Bolão] Não foi possível carregar dados do cloud:', e.message);
  }
}

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
function locked(){return new Date()>LOCK_DATE}

function togglePw(inputId,btnId){
  const el=document.getElementById(inputId);
  const btn=document.getElementById(btnId);
  if(el.type==='password'){el.type='text';btn.textContent='🙈';}
  else{el.type='password';btn.textContent='👁';}
}

async function doLogin(){
  const name=document.getElementById('inp-name').value.trim();
  const pw=document.getElementById('inp-pw').value;
  const err=document.getElementById('login-err');
  const info=document.getElementById('login-info');
  err.textContent='';info.textContent='';

  if(!name){err.textContent='Digite seu nome no bolão.';return;}
  if(pw.length<3){err.textContent='Senha deve ter pelo menos 3 caracteres.';return;}

  const hash=hashPw(pw);
  
  info.textContent='Aguarde, conectando ao servidor... 🔄';
  
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'login', user: name, passHash: hash })
    });

    const result = await response.json();

    if (result.ok) {
      info.textContent = 'Acesso liberado! 👋';
      
      // Mantém um registro local apenas para popular a lista visual de "quem já entrou"
      const users = getUsers();
      if (!users[name]) {
        users[name] = { joined: Date.now() };
        saveUsers(users);
      }
      
      S.user = name;
      saveSession(name);
      
      // Sincroniza os palpites da nuvem logo após o login
      await loadFromCloud();
      setTimeout(()=>showGroups(),500);
      
    } else {
      err.textContent = result.error;
      info.textContent = '';
    }
  } catch (error) {
    console.error('Erro de Login:', error);
    err.textContent = 'Erro de conexão. Verifique sua internet.';
    info.textContent = '';
  }
}

document.getElementById('inp-pw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('inp-name').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('inp-pw').focus();});

function doLogout(){S.user=null;clearSession();show('s-login');renderPlayersLogin();}

function fillName(n){
  document.getElementById('inp-name').value=n;
  document.getElementById('inp-pw').focus();
}

/* ═══════════════════════════════════════════════════════
   SCORES HELPERS
═══════════════════════════════════════════════════════ */
function getSc(user,id){
  const sc=getScores();
  return (sc[user]&&sc[user][id]!=null)?sc[user][id]:null;
}

function saveSc(user,id,h,a){
  // 1. Salva localmente (imediato, não depende de rede)
  const sc=getScores();
  if(!sc[user])sc[user]={};
  sc[user][id]={h,a};
  saveScores(sc);

  // 2. Dispara sincronização em background (não bloqueia UI)
  syncToCloud(user, id, h, a);
}

function countFilled(user){
  return ALL_IDS.filter(id=>{const s=getSc(user,id);return s&&s.h!==''&&s.a!==''}).length;
}

function userStatus(user){
  const n=countFilled(user);
  if(n===ALL_IDS.length)return'done';
  if(n>0)return'partial';
  return'empty';
}

function groupFillCount(letter,user){
  let total=0,done=0;
  MATCHES[letter].forEach(rd=>rd.games.forEach(g=>{
    total++;
    const s=getSc(user,g.id);
    if(s&&s.h!==''&&s.a!=='')done++;
  }));
  return{total,done};
}

/* ═══════════════════════════════════════════════════════
   PLAYERS LOGIN PANEL
═══════════════════════════════════════════════════════ */
function renderPlayersLogin(){
  const users=getUsers();
  const list=document.getElementById('players-list-login');
  if(!list)return;
  const names=Object.keys(users);
  if(!names.length){list.innerHTML='<div style="font-size:.78rem;color:var(--text3);text-align:center;padding:.5rem">Seja o primeiro a entrar! 🚀</div>';return;}
  list.innerHTML=names.map(n=>{
    const st=userStatus(n);
    const cnt=countFilled(n);
    const pct=Math.round(cnt/ALL_IDS.length*100);
    const dotCls=st==='done'?'green':st==='partial'?'gold':'red';
    const stat=st==='done'?'✔ Completo':`${cnt}/${ALL_IDS.length}`;
    return`<div class="p-item" onclick="fillName('${n.replace(/'/g,"\\'")}')">
      <div class="p-dot ${dotCls}"></div>
      <span class="p-name">${n}</span>
      <span class="p-stat">${stat}</span>
    </div>`;
  }).join('');
}
renderPlayersLogin();
setInterval(renderPlayersLogin, 15000);

// Auto-login por sessão
(function(){
  const saved=getSession();
  if(saved && getUsers()[saved]){
    S.user=saved;
    showGroups();
  }
})();

// Carrega do cloud em background
loadFromCloud();

/* ═══════════════════════════════════════════════════════
   SCREEN SWITCHER
═══════════════════════════════════════════════════════ */
function show(id){
  document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===id));
  window.scrollTo({top:0,behavior:'instant'});
}

/* ═══════════════════════════════════════════════════════
   GROUPS SCREEN
═══════════════════════════════════════════════════════ */
function showGroups(){
  const av=S.user?S.user[0].toUpperCase():'?';
  document.getElementById('avatar-g').textContent=av;
  document.getElementById('uname-g').textContent=S.user||'';
  document.getElementById('lock-chip-g').style.display=locked()?'flex':'none';
  renderGroupsGrid();
  show('s-groups');
}

function renderGroupsGrid(){
  const grid=document.getElementById('groups-grid');
  const total=ALL_IDS.length;
  const done=countFilled(S.user);
  document.getElementById('global-prog-label').textContent=`${done} / ${total} palpites preenchidos`;
  document.getElementById('global-prog-fill').style.width=`${(done/total)*100}%`;

  grid.innerHTML=Object.entries(GROUPS).map(([letter,data])=>{
    const {total:gt,done:gd}=groupFillCount(letter,S.user);
    const st=gd===gt?'done':gd>0?'partial':'';
    const badgeTxt=gd===gt?'✔ Completo':gd>0?`${gd}/${gt}`:'Pendente';
    const badgeCls=gd===gt?'done':gd>0?'partial':'empty';
    const pct=gt?Math.round(gd/gt*100):0;
    const flags=data.teams.map(t=>`<div class="tf-item"><span class="fl">${t.f}</span><span class="tn">${t.n}</span></div>`).join('');
    return`<div class="group-card ${st}" onclick="openGroup('${letter}')">
      <div class="g-head">
        <div class="g-letter">GRUPO ${letter}</div>
        <div class="g-badge ${badgeCls}">${badgeTxt}</div>
      </div>
      <div class="team-flags">${flags}</div>
      <div class="g-prog">
        <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
        <span class="lbl">${pct}%</span>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   TRAIL SCREEN
═══════════════════════════════════════════════════════ */
function openGroup(letter){
  S.group=letter;
  S.rounds=MATCHES[letter];
  showTrail();
}

function showTrail(){
  document.getElementById('tr-title').textContent=`GRUPO ${S.group}`;
  document.getElementById('lock-chip-tr').style.display=locked()?'flex':'none';
  renderTrail();
  show('s-trail');
}

function rdDone(ri){
  return S.rounds[ri].games.every(g=>{const s=getSc(S.user,g.id);return s&&s.h!==''&&s.a!==''});
}

function renderTrail(){
  const rounds=S.rounds;
  let ai=0;
  for(let i=0;i<rounds.length;i++){if(rdDone(i))ai=i+1;else{ai=i;break;}}
  if(rounds.every((_,i)=>rdDone(i)))ai=rounds.length-1;
  S.round=ai+1;

  const nc=['#f5c518','#00d4b8','#e84040'];
  const trpath=document.getElementById('trpath');

  trpath.innerHTML=rounds.map((rd,i)=>{
    const done=rdDone(i);
    const active=i===ai&&!done;
    const c=nc[i%nc.length];
    const nl=done?'✓':`R${rd.r}`;
    const nClass=done?'done':active?'active':'';
    const cClass=done?'done':active?'active':'';
    const isRight=i%2!==0;

    const matchup=rd.games.map(g=>`${g.h.f} ${g.h.n.split(' ')[0]} × ${g.a.f} ${g.a.n.split(' ')[0]}`).join('\n');
    const stKey=rd.games[0].st;
    const imgSrc=STIMG[stKey]||'';

    return`<div class="trail-step${isRight?' right':''}" style="--c:${c}">
      ${!isRight?`<div class="tnode ${nClass}" style="border-color:${c}">${nl}</div>`:''}
      <div class="tcard ${cClass}" 
           style="${active?`border-color:rgba(0,212,184,.3)`:done?`border-color:rgba(0,166,62,.3)`:''}"
           onclick="openRoundFromTrail(${i})"
           role="button"
           aria-label="Abrir Rodada ${rd.r}">
        <div class="tc-r">⚽ RODADA ${rd.r}</div>
        <div class="tc-s">${stKey}</div>
        <div class="tc-c">📍 ${rd.games[0].ci}</div>
        <div class="tc-d">📅 ${rd.games[0].dt} · ⏰ ${rd.games[0].tm}</div>
        <div class="tc-g">${matchup}</div>
        ${imgSrc?`<img class="stimg" src="${imgSrc}" alt="${stKey}" loading="lazy" onerror="this.style.display='none'">`:``}
      </div>
      ${isRight?`<div class="tnode ${nClass}" style="border-color:${c}">${nl}</div>`:''}
    </div>`;
  }).join('');

  document.getElementById('btn-act').textContent=`▶ PREENCHER RODADA ${S.round}`;
}

function openRoundFromTrail(roundIndex) {
  S.round = roundIndex + 1;
  enterRound();
}

function selRound(i){
  S.round=i+1;
  document.getElementById('btn-act').textContent=`▶ RODADA ${S.round}`;
}

function enterRound(){
  renderGames();
  show('s-games');
  const lk=locked();
  document.getElementById('ln-gm').style.display=lk?'flex':'none';
  document.getElementById('lock-chip-gm').style.display=lk?'flex':'none';
}

/* ═══════════════════════════════════════════════════════
   GAMES SCREEN
═══════════════════════════════════════════════════════ */
function renderGames(){
  const letter=S.group;
  const rd=S.rounds[S.round-1];
  const lk=locked();

  document.getElementById('gt-title').textContent=`GRUPO ${letter} · R${S.round}`;
  document.getElementById('rtag').textContent=`Rodada ${S.round}`;
  document.getElementById('rtitle').textContent=`Grupo ${letter} — Rodada ${S.round}`;

  const list=document.getElementById('glist');
  list.innerHTML=rd.games.map((g,gi)=>{
    const id=g.id;
    const sc=getSc(S.user,id);
    const hv=sc?sc.h:'';
    const av=sc?sc.a:'';
    const saved=hv!==''&&av!=='';
    return`<div class="game-card${saved?' saved':''}" id="gc-${id}">
      <div class="meta-row">
        <span class="mtag">📅 ${g.dt}</span>
        <span class="mtag">⏰ ${g.tm}</span>
        <span class="mtag">🏟 ${g.st}</span>
        <span class="mtag">📍 ${g.ci}</span>
      </div>
      <div class="match-row">
        <div class="ts"><span class="flag" style="font-size:2.1rem">${g.h.f}</span><span class="tname">${g.h.n}</span></div>
        <div class="score-blk">
          <input class="sin" type="number" min="0" max="99" id="h-${id}" value="${hv}" placeholder="–" ${lk?'disabled':''}
            oninput="onInput('${id}',${gi})">
          <span class="xsep">×</span>
          <input class="sin" type="number" min="0" max="99" id="a-${id}" value="${av}" placeholder="–" ${lk?'disabled':''}
            oninput="onInput('${id}',${gi})">
        </div>
        <div class="ts"><span class="flag" style="font-size:2.1rem">${g.a.f}</span><span class="tname">${g.a.n}</span></div>
      </div>
      <div class="gfoot">
        <div class="malert" id="al-${id}">⚠ Preencha os dois campos!</div>
        ${lk
          ?`<span style="font-size:.7rem;color:#ff7a8a;margin-left:auto">🔒 Bloqueado</span>`
          :`<button class="btn-save" onclick="saveGame('${id}',${gi})">💾 Salvar</button>`
        }
        <span class="sbadge" id="sb-${id}" ${saved?'':'style="display:none"'}>✔ Salvo</span>
      </div>
    </div>`;
  }).join('');

  updProg();
  document.getElementById('bprev').disabled=S.round<=1;
  document.getElementById('bnext').disabled=S.round>=S.rounds.length;
}

function onInput(id){
  const h=document.getElementById(`h-${id}`).value;
  const a=document.getElementById(`a-${id}`).value;
  if(h!==''&&a!=='')saveGame(id,0,true);
}

function saveGame(id,gi,silent=false){
  const h=document.getElementById(`h-${id}`).value.trim();
  const a=document.getElementById(`a-${id}`).value.trim();
  const al=document.getElementById(`al-${id}`);
  if(h===''||a===''){
    al.style.display='block';
    al.style.animation='none';
    requestAnimationFrame(()=>{al.style.animation='shake .35s'});
    setTimeout(()=>al.style.display='none',3500);
    return;
  }
  al.style.display='none';
  saveSc(S.user,id,h,a);

  const card=document.getElementById(`gc-${id}`);
  card.classList.add('saved');
  const sb=document.getElementById(`sb-${id}`);
  if(sb)sb.style.display='inline-flex';

  if(!silent)toast('✔ Placar salvo!','ok');
  updProg();
  renderPlayersLogin();
  checkAuto();
}

/* ═══════════════════════════════════════════════════════
   POPUP "VAMOS CONTINUAR?" — lógica central
═══════════════════════════════════════════════════════ */
function checkAuto(){
  // Cancela qualquer timer pendente antes de avaliar
  clearTimeout(autoPopupTimer);

  const rd = S.rounds[S.round-1];
  const roundDone = rd.games.every(g=>{const s=getSc(S.user,g.id);return s&&s.h!==''&&s.a!==''});

  if (!roundDone) return; // rodada ainda incompleta

  const isLastRound = S.round >= S.rounds.length;

  if (!isLastRound) {
    // ── Caso 1: Rodada completa, ainda tem próxima rodada ──
    autoPopupTimer = setTimeout(() => {
      showContinuePopup('round');
    }, POPUP_DELAY_MS);

  } else {
    // ── Última rodada — verifica se o grupo todo está completo ──
    const groupAllDone = S.rounds.every((_,i)=>rdDone(i));

    if (groupAllDone) {
      const keys = Object.keys(GROUPS);
      const isLastGroup = S.group === keys[keys.length - 1];

      autoPopupTimer = setTimeout(() => {
        showContinuePopup(isLastGroup ? 'finish' : 'group');
      }, POPUP_DELAY_MS);
    }
  }
}

function showContinuePopup(mode) {
  popupMode = mode;
  const overlay  = document.getElementById('continue-overlay');
  const modal    = document.getElementById('continue-overlay').querySelector('.continue-modal');
  const icon     = document.getElementById('continue-icon');
  const title    = document.getElementById('continue-title');
  const sub      = document.getElementById('continue-sub');
  const ctaText  = document.getElementById('continue-cta-text');

  // Configura conteúdo conforme o modo
  modal.classList.remove('next-group');

  if (mode === 'round') {
    icon.textContent    = '🎉';
    title.textContent   = 'Vamos continuar?';
    sub.textContent     = `Rodada ${S.round} completa!`;
    ctaText.textContent = 'Ir para a próxima rodada';
  } else if (mode === 'group') {
    modal.classList.add('next-group');
    icon.textContent    = '🏆';
    title.textContent   = 'Vamos continuar?';
    sub.textContent     = `Grupo ${S.group} completo!`;
    ctaText.textContent = 'Ir para o próximo grupo';
  } else if (mode === 'finish') {
    modal.classList.add('next-group');
    icon.textContent    = '🌟';
    title.textContent   = 'Parabéns!';
    sub.textContent     = 'Todos os grupos preenchidos!';
    ctaText.textContent = 'Ver resumo';
  }

  overlay.style.display = 'flex';
}

function handleContinue() {
  closeContinue();
  if (popupMode === 'round') {
    chRound(1);
  } else if (popupMode === 'group') {
    goToNextGroup();
  } else if (popupMode === 'finish') {
    toast('🏆 Todos os grupos preenchidos!','ok');
    showGroups();
  }
}

function closeContinue() {
  document.getElementById('continue-overlay').style.display = 'none';
  clearTimeout(autoPopupTimer);
}

// Fecha ao clicar fora do modal
document.getElementById('continue-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeContinue();
});

// Fecha com Esc
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeContinue();
});

/* ═══════════════════════════════════════════════════════
   NAVEGAÇÃO ENTRE GRUPOS
═══════════════════════════════════════════════════════ */
function goToNextGroup() {
  const keys = Object.keys(GROUPS);
  const currIdx = keys.indexOf(S.group);
  if (currIdx >= 0 && currIdx < keys.length - 1) {
    openGroup(keys[currIdx + 1]);
  } else {
    toast('🏆 Todos os grupos preenchidos!','ok');
    showGroups();
  }
}

/* ═══════════════════════════════════════════════════════
   PROGRESS BAR & NAVEGAÇÃO DE RODADAS
═══════════════════════════════════════════════════════ */
function updProg(){
  const rd=S.rounds[S.round-1];
  const total=rd.games.length;
  const done=rd.games.filter(g=>{const s=getSc(S.user,g.id);return s&&s.h!==''&&s.a!==''}).length;
  const pct=total?Math.round(done/total*100):0;

  document.getElementById('pglbl').textContent=`${done}/${total} salvos`;
  document.getElementById('pg-pct').textContent=`${pct}%`;
  document.getElementById('pgfill').style.width=`${pct}%`;

  const bnext = document.getElementById('bnext');

  if (S.round === S.rounds.length) {
    if (done === total) {
      const keys = Object.keys(GROUPS);
      const isLastGroup = S.group === keys[keys.length - 1];
      bnext.textContent = isLastGroup ? 'Ver Resumo ▶' : 'Próximo Grupo ▶';
      bnext.onclick = isLastGroup ? () => showGroups() : () => goToNextGroup();
      bnext.disabled = false;
      bnext.classList.add('btn-destaque');
    } else {
      bnext.textContent = 'Próxima ▶';
      bnext.onclick = () => chRound(1);
      bnext.disabled = true;
      bnext.classList.remove('btn-destaque');
    }
  } else {
    bnext.textContent = 'Próxima ▶';
    bnext.onclick = () => chRound(1);
    bnext.disabled = false;
    bnext.classList.remove('btn-destaque');
  }
}

function chRound(d){
  S.round+=d;
  renderGames();
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ═══════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════ */
let toastTimer=null;
function toast(msg,type='ok'){
  const el=document.getElementById('toast');
  el.textContent=msg;
  el.className='show '+type;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.className='',2500);
}