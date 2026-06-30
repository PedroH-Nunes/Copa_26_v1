/* ═══════════════════════════════════════════════════════
   BACKEND — GOOGLE APPS SCRIPT
   ───────────────────────────────────────────────────────
   O código real do backend está no arquivo Code.gs.
   Este bloco é apenas referência histórica.
═══════════════════════════════════════════════════════ */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfCRnqBItqDumAQUMHiyLHOiacaiYSJsPYe2viMiG2udlM-dnNNs_mKVxGatIq1QtK3g/exec'; // ← URL do Apps Script

/* ═══════════════════════════════════════════════════════
   CONFIG & ESTADO NA NUVEM
═══════════════════════════════════════════════════════ */
const STORAGE_KEY = 'bolao2026_v1';
const POPUP_DELAY_MS = 3000;

let cloudState = { scores: {}, oficiais: {}, usuarios: [] };
let cloudLoaded = false;
let isFetchingCloud = false; // Trava de carregamento simultâneo

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
      {id:'A1R2G1',h:{f:'🇲🇽',n:'México'},a:{f:'🇰🇷',n:'Coreia do Sul'},dt:'18/Jun (Qui)',tm:'22h',st:'Estádio Akron',ci:'Guadalajara, MEX'},
      {id:'A1R2G2',h:{f:'🇨🇿',n:'República Tcheca'},a:{f:'🇿🇦',n:'África do Sul'},dt:'18/Jun (Qui)',tm:'13h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
    {r:3,games:[
      {id:'A1R3G1',h:{f:'🇲🇽',n:'México'},a:{f:'🇨🇿',n:'República Tcheca'},dt:'24/Jun (Qua)',tm:'22h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
      {id:'A1R3G2',h:{f:'🇿🇦',n:'África do Sul'},a:{f:'🇰🇷',n:'Coreia do Sul'},dt:'24/Jun (Qua)',tm:'22h',st:'El Gigante de Acero',ci:'Guadalajara, MEX'},
    ]},
  ],
  B:[
    {r:1,games:[
      {id:'B1R1G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇧🇦',n:'Bósnia'},dt:'12/Jun (Sex)',tm:'16h',st:'BMO Field',ci:'Toronto, CAN'},
      {id:'B1R1G2',h:{f:'🇶🇦',n:'Catar'},a:{f:'🇨🇭',n:'Suíça'},dt:'13/Jun (Sáb)',tm:'16h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
    ]},
    {r:2,games:[
      {id:'B1R2G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇶🇦',n:'Catar'},dt:'18/Jun (Qui)',tm:'19h',st:'BC Place',ci:'Vancouver, CAN'},
      {id:'B1R2G2',h:{f:'🇨🇭',n:'Suíça'},a:{f:'🇧🇦',n:'Bósnia'},dt:'18/Jun (Qui)',tm:'16h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
    ]},
    {r:3,games:[
      {id:'B1R3G1',h:{f:'🇨🇦',n:'Canadá'},a:{f:'🇨🇭',n:'Suíça'},dt:'24/Jun (Qua)',tm:'16h',st:'BMO Field',ci:'Toronto, CAN'},
      {id:'B1R3G2',h:{f:'🇧🇦',n:'Bósnia'},a:{f:'🇶🇦',n:'Catar'},dt:'24/Jun (Qua)',tm:'16h',st:'BC Place',ci:'Vancouver, CAN'},
    ]},
  ],
  C:[
    {r:1,games:[
      {id:'C1R1G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'🇲🇦',n:'Marrocos'},dt:'13/Jun (Sáb)',tm:'19h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'C1R1G2',h:{f:'🇭🇹',n:'Haiti'},a:{f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'},dt:'13/Jun (Sáb)',tm:'22h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
    {r:2,games:[
      {id:'C1R2G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'🇭🇹',n:'Haiti'},dt:'19/Jun (Sex)',tm:'21h30',st:'Camping World Stadium',ci:'Orlando, EUA'},
      {id:'C1R2G2',h:{f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'},a:{f:'🇲🇦',n:'Marrocos'},dt:'19/Jun (Sex)',tm:'19h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
    ]},
    {r:3,games:[
      {id:'C1R3G1',h:{f:'🇧🇷',n:'Brasil'},a:{f:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',n:'Escócia'},dt:'24/Jun (Qua)',tm:'19h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'C1R3G2',h:{f:'🇲🇦',n:'Marrocos'},a:{f:'🇭🇹',n:'Haiti'},dt:'24/Jun (Qua)',tm:'19h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
  ],
  D:[
    {r:1,games:[
      {id:'D1R1G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇵🇾',n:'Paraguai'},dt:'12/Jun (Sex)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'D1R1G2',h:{f:'🇦🇺',n:'Austrália'},a:{f:'🇹🇷',n:'Turquia'},dt:'14/Jun (Dom)',tm:'01h',st:'BC Place',ci:'Vancouver, CAN'},
    ]},
    {r:2,games:[
      {id:'D1R2G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇦🇺',n:'Austrália'},dt:'19/Jun (Sex)',tm:'16h',st:'Lumen Field',ci:'Seattle, EUA'},
      {id:'D1R2G2',h:{f:'🇹🇷',n:'Turquia'},a:{f:'🇵🇾',n:'Paraguai'},dt:'20/Jun (Sab)',tm:'00h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
    {r:3,games:[
      {id:'D1R3G1',h:{f:'🇺🇸',n:'EUA'},a:{f:'🇹🇷',n:'Turquia'},dt:'25/Jun (Qui)',tm:'23h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'D1R3G2',h:{f:'🇵🇾',n:'Paraguai'},a:{f:'🇦🇺',n:'Austrália'},dt:'25/Jun (Qui)',tm:'23h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
  ],
  E:[
    {r:1,games:[
      {id:'E1R1G1',h:{f:'🇩🇪',n:'Alemanha'},a:{f:'🇨🇼',n:'Curaçao'},dt:'14/Jun (Dom)',tm:'14h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'E1R1G2',h:{f:'🇨🇮',n:'Costa do Marfim'},a:{f:'🇪🇨',n:'Equador'},dt:'14/Jun (Dom)',tm:'20h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:2,games:[
      {id:'E1R2G1',h:{f:'🇩🇪',n:'Alemanha'},a:{f:'🇨🇮',n:'Costa do Marfim'},dt:'20/Jun (Sab)',tm:'17h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'E1R2G2',h:{f:'🇪🇨',n:'Equador'},a:{f:'🇨🇼',n:'Curaçao'},dt:'20/Jun (Sab)',tm:'21h',st:'Gillette Stadium',ci:'Boston, EUA'},
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
      {id:'F1R2G1',h:{f:'🇳🇱',n:'Holanda'},a:{f:'🇸🇪',n:'Suécia'},dt:'20/Jun (Sab)',tm:'14h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
      {id:'F1R2G2',h:{f:'🇹🇳',n:'Tunísia'},a:{f:'🇯🇵',n:'Japão'},dt:'21/Jun (Dom)',tm:'01h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:3,games:[
      {id:'F1R3G1',h:{f:'🇳🇱',n:'Holanda'},a:{f:'🇹🇳',n:'Tunísia'},dt:'25/Jun (Qui)',tm:'20h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'F1R3G2',h:{f:'🇯🇵',n:'Japão'},a:{f:'🇸🇪',n:'Suécia'},dt:'25/Jun (Qui)',tm:'20h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
    ]},
  ],
  G:[
    {r:1,games:[
      {id:'G1R1G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇪🇬',n:'Egito'},dt:'15/Jun (Seg)',tm:'16h',st:'Lumen Field',ci:'Seattle, EUA'},
      {id:'G1R1G2',h:{f:'🇮🇷',n:'Irã'},a:{f:'🇳🇿',n:'Nova Zelândia'},dt:'15/Jun (Seg)',tm:'22h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
    ]},
    {r:2,games:[
      {id:'G1R2G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇮🇷',n:'Irã'},dt:'21/Jun (Dom)',tm:'16h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'G1R2G2',h:{f:'🇳🇿',n:'Nova Zelândia'},a:{f:'🇪🇬',n:'Egito'},dt:'21/Jun (Dom)',tm:'22h',st:'BMO Field',ci:'Toronto, CAN'},
    ]},
    {r:3,games:[
      {id:'G1R3G1',h:{f:'🇧🇪',n:'Bélgica'},a:{f:'🇳🇿',n:'Nova Zelândia'},dt:'27/Jun (Sab)',tm:'00h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'G1R3G2',h:{f:'🇪🇬',n:'Egito'},a:{f:'🇮🇷',n:'Irã'},dt:'27/Jun (Sab)',tm:'00h',st:'Lumen Field',ci:'Seattle, EUA'},
    ]},
  ],
  H:[
    {r:1,games:[
      {id:'H1R1G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇨🇻',n:'Cabo Verde'},dt:'15/Jun (Seg)',tm:'13h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
      {id:'H1R1G2',h:{f:'🇸🇦',n:'Arábia Saudita'},a:{f:'🇺🇾',n:'Uruguai'},dt:'15/Jun (Seg)',tm:'19h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
    ]},
    {r:2,games:[
      {id:'H1R2G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇸🇦',n:'Arábia Saudita'},dt:'21/Jun (Dom)',tm:'13h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'H1R2G2',h:{f:'🇺🇾',n:'Uruguai'},a:{f:'🇨🇻',n:'Cabo Verde'},dt:'21/Jun (Dom)',tm:'19h',st:'NRG Stadium',ci:'Houston, EUA'},
    ]},
    {r:3,games:[
      {id:'H1R3G1',h:{f:'🇪🇸',n:'Espanha'},a:{f:'🇺🇾',n:'Uruguai'},dt:'26/Jun (Sex)',tm:'21h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
      {id:'H1R3G2',h:{f:'🇨🇻',n:'Cabo Verde'},a:{f:'🇸🇦',n:'Arábia Saudita'},dt:'26/Jun (Sex)',tm:'21h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
  ],
  I:[
    {r:1,games:[
      {id:'I1R1G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇸🇳',n:'Senegal'},dt:'16/Jun (Ter)',tm:'16h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'I1R1G2',h:{f:'🇮🇶',n:'Iraque'},a:{f:'🇳🇴',n:'Noruega'},dt:'16/Jun (Ter)',tm:'19h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
    {r:2,games:[
      {id:'I1R2G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇮🇶',n:'Iraque'},dt:'22/Jun (Seg)',tm:'18h',st:'Hard Rock Stadium',ci:'Miami, EUA'},
      {id:'I1R2G2',h:{f:'🇳🇴',n:'Noruega'},a:{f:'🇸🇳',n:'Senegal'},dt:'22/Jun (Seg)',tm:'21h',st:'Mercedes-Benz Stadium',ci:'Atlanta, EUA'},
    ]},
    {r:3,games:[
      {id:'I1R3G1',h:{f:'🇫🇷',n:'França'},a:{f:'🇳🇴',n:'Noruega'},dt:'26/Jun (Sex)',tm:'16h',st:'MetLife Stadium',ci:'Nova York/NJ, EUA'},
      {id:'I1R3G2',h:{f:'🇸🇳',n:'Senegal'},a:{f:'🇮🇶',n:'Iraque'},dt:'26/Jun (Sex)',tm:'16h',st:'Gillette Stadium',ci:'Boston, EUA'},
    ]},
  ],
  J:[
    {r:1,games:[
      {id:'J1R1G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇩🇿',n:'Argélia'},dt:'16/Jun (Ter)',tm:'22h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
      {id:'J1R1G2',h:{f:'🇦🇹',n:'Áustria'},a:{f:'🇯🇴',n:'Jordânia'},dt:'17/Jun (Qua)',tm:'01h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
    ]},
    {r:2,games:[
      {id:'J1R2G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇦🇹',n:'Áustria'},dt:'22/Jun (Seg)',tm:'14h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'J1R2G2',h:{f:'🇯🇴',n:'Jordânia'},a:{f:'🇩🇿',n:'Argélia'},dt:'23/Jun (Ter)',tm:'00h',st:'Lincoln Financial Field',ci:'Filadélfia, EUA'},
    ]},
    {r:3,games:[
      {id:'J1R3G1',h:{f:'🇦🇷',n:'Argentina'},a:{f:'🇯🇴',n:'Jordânia'},dt:'27/Jun (Sáb)',tm:'23h',st:'SoFi Stadium',ci:'Los Angeles, EUA'},
      {id:'J1R3G2',h:{f:'🇩🇿',n:'Argélia'},a:{f:'🇦🇹',n:'Áustria'},dt:'27/Jun (Sáb)',tm:'23h',st:'Arrowhead Stadium',ci:'Kansas City, EUA'},
    ]},
  ],
  K:[
    {r:1,games:[
      {id:'K1R1G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇨🇩',n:'RD Congo'},dt:'17/Jun (Qua)',tm:'14h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'K1R1G2',h:{f:'🇺🇿',n:'Uzbequistão'},a:{f:'🇨🇴',n:'Colômbia'},dt:'17/Jun (Qua)',tm:'23h',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
    ]},
    {r:2,games:[
      {id:'K1R2G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇺🇿',n:'Uzbequistão'},dt:'23/Jun (Ter)',tm:'14h',st:"Levi's Stadium",ci:'San Francisco, EUA'},
      {id:'K1R2G2',h:{f:'🇨🇴',n:'Colômbia'},a:{f:'🇨🇩',n:'RD Congo'},dt:'23/Jun (Ter)',tm:'23h',st:'AT&T Stadium',ci:'Dallas, EUA'},
    ]},
    {r:3,games:[
      {id:'K1R3G1',h:{f:'🇵🇹',n:'Portugal'},a:{f:'🇨🇴',n:'Colômbia'},dt:'27/Jun (Sáb)',tm:'20h30',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'K1R3G2',h:{f:'🇨🇩',n:'RD Congo'},a:{f:'🇺🇿',n:'Uzbequistão'},dt:'27/Jun (Sáb)',tm:'20h30',st:'Estádio Azteca',ci:'Cidade do México, MEX'},
    ]},
  ],
  L:[
    {r:1,games:[
      {id:'L1R1G1',h:{f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},a:{f:'🇭🇷',n:'Croácia'},dt:'17/Jun (Qua)',tm:'17h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'L1R1G2',h:{f:'🇬🇭',n:'Gana'},a:{f:'🇵🇦',n:'Panamá'},dt:'17/Jun (Qua)',tm:'20h',st:'BMO Field',ci:'Toronto, CAN'},
    ]},
    {r:2,games:[
      {id:'L1R2G1',h:{f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},a:{f:'🇬🇭',n:'Gana'},dt:'23/Jun (Ter)',tm:'17h',st:'NRG Stadium',ci:'Houston, EUA'},
      {id:'L1R2G2',h:{f:'🇵🇦',n:'Panamá'},a:{f:'🇭🇷',n:'Croácia'},dt:'23/Jun (Ter)',tm:'20h',st:'Estadio BBVA',ci:'Monterrey, MEX'},
    ]},
    {r:3,games:[
      {id:'L1R3G1',h:{f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',n:'Inglaterra'},a:{f:'🇵🇦',n:'Panamá'},dt:'27/Jun (Sáb)',tm:'18h',st:'AT&T Stadium',ci:'Dallas, EUA'},
      {id:'L1R3G2',h:{f:'🇭🇷',n:'Croácia'},a:{f:'🇬🇭',n:'Gana'},dt:'27/Jun (Sáb)',tm:'18h',st:'BMO Field',ci:'Toronto, CAN'},
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

// Helpers de Tempo (Verifica Bloqueio Individual por Jogo)
const MON_MAP = { Jan:1, Fev:2, Mar:3, Abr:4, Mai:5, Jun:6, Jul:7, Ago:8, Set:9, Out:10, Nov:11, Dez:12 };

function gameKickoff(g) {
  const parts = g.dt.split('/');
  const day   = parts[0].padStart(2,'0');
  const mon   = parts[1].split(' ')[0];
  const month = String(MON_MAP[mon] || 6).padStart(2,'0');
  const hour  = String(parseInt(g.tm)).padStart(2,'0');
  return new Date(`2026-${month}-${day}T${hour}:00:00-03:00`);
}

function gameIsLocked(g) {
  return new Date() >= gameKickoff(g);
}

/* ═══════════════════════════════════════════════════════
   STORAGE LOCAL (offline-safe, instantâneo)
   ───────────────────────────────────────────────────────
   IMPORTANTE: este storage local NÃO é a fonte de verdade
   do ranking. Ele serve só como (1) sessão de login,
   (2) fila de sincronização offline e (3) cache de leitura
   instantânea. A fonte de verdade real é sempre o Google
   Sheets (cloudState), carregado via loadFromCloud().
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

// 🔴 CORREÇÃO: agora aceita e envia também o campo "winner" (necessário
// para o mata-mata, onde o usuário escolhe quem avança em caso de empate).
// Sem isso o backend nunca recebia esse dado e o palpite ficava incompleto.
async function syncToCloud(user, matchId, h, a, winner) {
  if (!GOOGLE_SCRIPT_URL) return; // sem URL configurada, só local

  const payload = {action:'save_score', user, match_id:matchId, score_home:h, score_away:a, winner: winner || ''};

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
        headers:{'Content-Type':'text/plain;charset=utf-8'}, // 🔴 CORS Ajustado
        body:JSON.stringify(q[i])
      });
      q.splice(i, 1);
      i--;
      saveSyncQueue(q);
    } catch (err) {
      // ficará na fila para tentar depois
      console.warn('[Bolão] Falha ao sincronizar, tentará novamente:', err.message);
      break;
    }
  }

  isSyncing = false;

  if (getSyncQueue().length === 0) {
    setSyncStatus('synced', '✔ Sincronizado');
    setTimeout(() => setSyncStatus('', ''), 3000);

    // GATILHO: Assim que terminar de salvar seus dados, já puxa as atualizações de todo mundo
    loadFromCloud();
  } else {
    setSyncStatus('error', '⚠ Sem conexão — salvo localmente');
  }
}

// Ao voltar online, processa a fila
window.addEventListener('online', () => {
  setSyncStatus('syncing', '🔄 Reconectado, sincronizando...');
  processQueue();
});

// Função de Carregamento Focada na Nuvem como Verdade
async function loadFromCloud() {
  if (!GOOGLE_SCRIPT_URL || isFetchingCloud) return;
  isFetchingCloud = true; // Bloqueia novas chamadas enquanto esta não terminar

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL + '?action=get_scores&t=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();

    // Atualiza estado em memória (Fonte de verdade)
    if (data.palpites) cloudState.scores   = data.palpites;
    if (data.oficiais) cloudState.oficiais = data.oficiais;
    if (data.usuarios) cloudState.usuarios = data.usuarios;

    // Sincroniza localmente para backup/offline da sessão ativa
    if (data.palpites && S.user && data.palpites[S.user]) {
      const sc = getScores();
      sc[S.user] = { ...(sc[S.user] || {}), ...data.palpites[S.user] };
      saveScores(sc);
    }
    if (data.oficiais) {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(data.oficiais));
    }

    cloudLoaded = true;
    renderPlayersLogin();

    const rEl = document.getElementById('s-ranking');
    if (rEl && rEl.classList.contains('active')) renderRanking();

    const gEl = document.getElementById('s-groups');
    if (gEl && gEl.classList.contains('active')) renderGroupsGrid();

  } catch(e) {
    console.warn('[Bolão] Cloud offline:', e.message);
  } finally {
    isFetchingCloud = false; // Libera para a próxima busca
  }
}

// 1. Polling mais rápido (10s)
setInterval(loadFromCloud, 10000);

// 2. Atualiza ao focar na aba ou ligar a tela
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') loadFromCloud();
});

// 3. Sincronização entre abas no mesmo navegador
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || e.key === RESULTS_KEY) {
    loadFromCloud();
  }
});

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
function togglePw(inputId,btnId){
  const el=document.getElementById(inputId);
  const btn=document.getElementById(btnId);
  if(el.type==='password'){el.type='text';btn.textContent='🙈';}
  else{el.type='password';btn.textContent='👁';}
}

// 🔴 CORREÇÃO: antes essa função era "dispara e esquece" (sem retry).
// Se a única tentativa falhasse (rede instável, lock do Sheets ocupado),
// o usuário nunca era registrado na aba Usuarios e sumia do ranking
// mesmo tendo palpites salvos corretamente. Agora tenta até 3x.
async function syncLoginToCloud(username, passHash) {
  if (!GOOGLE_SCRIPT_URL) return;
  const payload = { action: 'login', user: username, passHash: passHash };

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return; // sucesso
    } catch (error) {
      console.warn(`[Bolão] Tentativa ${tentativa + 1}/3 de registrar usuário falhou:`, error.message);
      await new Promise(r => setTimeout(r, 1500 * (tentativa + 1)));
    }
  }
  console.error('[Bolão] Falha ao registrar usuário na nuvem após 3 tentativas:', username);
}

function doLogin(){
  const name=document.getElementById('inp-name').value.trim();
  const pw=document.getElementById('inp-pw').value;
  const err=document.getElementById('login-err');
  const info=document.getElementById('login-info');
  err.textContent='';info.textContent='';

  if(!name){err.textContent='Digite seu nome no bolão.';return;}
  if(pw.length<3){err.textContent='Senha deve ter pelo menos 3 caracteres.';return;}

  const users=getUsers();
  const hash=hashPw(pw);

  if(users[name]){
    if(users[name].pw!==hash){err.textContent='Senha incorreta para este nome.';return;}
    info.textContent='Bem-vindo de volta, '+name+'! 👋';
  } else {
    users[name]={pw:hash,joined:Date.now()};
    saveUsers(users);
    info.textContent='Cadastro realizado! Bem-vindo, '+name+'! 🎉';
  }

  // Sincroniza usuário com o Backend
  syncLoginToCloud(name, hash);

  S.user=name;
  saveSession(name);
  setTimeout(()=>showGroups(),500);
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
  // Prefere buscar da nuvem se disponível, senão do local storage
  const sc = cloudLoaded ? cloudState.scores : getScores();
  return (sc[user]&&sc[user][id]!=null)?sc[user][id]:null;
}

function saveSc(user,id,h,a){
  // 1. Salva localmente (imediato, não depende de rede)
  const sc=getScores();
  if(!sc[user])sc[user]={};
  sc[user][id]={h,a};
  saveScores(sc);

  // Atualiza também o state em memória de forma síncrona
  if(!cloudState.scores[user]) cloudState.scores[user] = {};
  cloudState.scores[user][id] = {h, a};

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

  const lockChip = document.getElementById('lock-chip-g');
  if(lockChip) lockChip.style.display = 'none';

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

  const lockChip = document.getElementById('lock-chip-tr');
  if(lockChip) lockChip.style.display = 'none';

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

  const lnGm = document.getElementById('ln-gm');
  if(lnGm) lnGm.style.display = 'none';

  const lcGm = document.getElementById('lock-chip-gm');
  if(lcGm) lcGm.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════
   GAMES SCREEN
═══════════════════════════════════════════════════════ */
function renderGames(){
  const letter=S.group;
  const rd=S.rounds[S.round-1];

  document.getElementById('gt-title').textContent=`GRUPO ${letter} · R${S.round}`;
  document.getElementById('rtag').textContent=`Rodada ${S.round}`;
  document.getElementById('rtitle').textContent=`Grupo ${letter} — Rodada ${S.round}`;

  const list=document.getElementById('glist');

  list.innerHTML=rd.games.map((g,gi)=>{
    const id=g.id;
    // O bloqueio agora é individual
    const lk = gameIsLocked(g);

    const sc = getSc(S.user, id);
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
  // Checagem extra de segurança no momento do clique
  const g = S.rounds[S.round-1].games.find(x => x.id === id);
  if (g && gameIsLocked(g)) { toast('🔒 Jogo já iniciado! Não é possível alterar.', 'err'); return; }

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
  clearTimeout(autoPopupTimer);
  const rd = S.rounds[S.round-1];
  const roundDone = rd.games.every(g=>{const s=getSc(S.user,g.id);return s&&s.h!==''&&s.a!==''});
  if (!roundDone) return;

  const isLastRound = S.round >= S.rounds.length;

  if (!isLastRound) {
    autoPopupTimer = setTimeout(() => {
      showContinuePopup('round');
    }, POPUP_DELAY_MS);
  } else {
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

document.getElementById('continue-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeContinue();
});
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

/* ═══════════════════════════════════════════════════════
   RANKING & RESULTADOS OFICIAIS
═══════════════════════════════════════════════════════ */
const RESULTS_KEY = 'bolao2026_results';
const ADMIN_PW_HASH = hashPw('admin123'); // senha padrão para testes

function getOfficialResults(){return JSON.parse(localStorage.getItem(RESULTS_KEY)||'{}')}

async function saveOfficialResult(matchId, h, a){
  // 1. Puxa os resultados oficiais locais corretamente e salva
  const results = getOfficialResults();
  results[matchId] = {h, a};
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));

  // 2. Envia para a planilha do Google
  if (!GOOGLE_SCRIPT_URL) return;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 🔴 CORS Ajustado
      body: JSON.stringify({
        action: 'save_official',
        match_id: matchId,
        score_home: h,
        score_away: a
      })
    });
  } catch (error) {
    console.error("Erro ao sincronizar resultado oficial:", error);
  }
}

function calcPoints(palpite, oficial){
  if(!palpite || palpite.h==='' || palpite.a==='') return null;
  if(!oficial  || oficial.h ==='' || oficial.a ==='') return null;

  const ph=parseInt(palpite.h), pa=parseInt(palpite.a);
  const oh=parseInt(oficial.h),  oa=parseInt(oficial.a);

  if(ph===oh && pa===oa) return 3;

  const pRes = ph>pa?'H': ph<pa?'A':'D';
  const oRes = oh>oa?'H': oh<oa?'A':'D';
  if(pRes===oRes) return 1.5;

  return 0;
}

// 🔴 CORREÇÃO: showRanking agora é assíncrona e ESPERA o loadFromCloud()
// terminar antes de renderizar. Antes, renderRanking() rodava de imediato
// e podia usar dados locais desatualizados (cloudLoaded ainda false),
// mostrando só o que existia neste navegador.
async function showRanking(){
  show('s-ranking');
  const isAdmin = localStorage.getItem('bolao_admin')==='1';
  document.getElementById('btn-admin-results').style.display = isAdmin ? 'block' : 'none';

  const list = document.getElementById('ranking-list');
  if (list) {
    list.innerHTML = `<div class="ranking-empty"><div class="re-icon">⏳</div><p>Carregando ranking do servidor...</p></div>`;
  }
  setSyncStatus('syncing', '🔄 Carregando ranking...');

  await loadFromCloud();

  setSyncStatus('', '');
  renderRanking();
  populateAdminGroupSelect();
}

function renderRanking(){
  const {ranking, matchesWithResult} = buildRanking();
  const info = document.getElementById('ranking-matches-info');
  if(info){
      info.textContent = matchesWithResult > 0
        ? `${matchesWithResult} jogo${matchesWithResult!==1?'s':''} com resultado oficial`
        : 'Nenhum resultado oficial inserido ainda';
  }

  const list = document.getElementById('ranking-list');

  if(!ranking.length){
    if(list) list.innerHTML=`<div class="ranking-empty"><div class="re-icon">👥</div><p>Nenhum participante ainda.</p></div>`;
    return;
  }

  const medals=['🥇','🥈','🥉'];

  if(list){
      list.innerHTML = ranking.map((r,i)=>{
        const pos = i+1;
        const posCls = pos===1?'p1':pos===2?'p2':pos===3?'p3':'pN';
        const cardCls = pos<=3?`rank-${pos}`:'';
        const medal = medals[i] || '';
        const pct = ALL_IDS.length ? Math.round(r.filled/ALL_IDS.length*100) : 0;
        const ptsDisplay = r.pts % 1 === 0 ? r.pts.toString() : r.pts.toFixed(1);

        return`<div class="rank-card ${cardCls}" onclick="showUserDetail('${r.user.replace(/'/g,"\\'")}')">
          ${medal?`<div class="rank-medal">${medal}</div>`:''}
          <div class="rank-row">
            <div class="rank-pos ${posCls}">${pos}°</div>
            <div class="rank-avatar">${r.user[0].toUpperCase()}</div>
            <div class="rank-info">
              <div class="rank-name">${r.user}</div>
              <div class="rank-breakdown">
                <span class="rbd-chip rbd-exact">⚡ ${r.exact} exatos</span>
                <span class="rbd-chip rbd-partial">✓ ${r.partial} parciais</span>
                ${r.miss?`<span class="rbd-chip rbd-miss">✗ ${r.miss} erros</span>`:''}
              </div>
              <div class="rank-progress">
                <div class="rp-bar-outer"><div class="rp-bar-inner" style="width:${pct}%"></div></div>
              </div>
            </div>
            <div class="rank-pts-box">
              <div class="rank-pts-num">${ptsDisplay}</div>
              <div class="rank-pts-label">PTS</div>
            </div>
          </div>
        </div>`;
      }).join('');
  }
}

function closeRankingDetail(){
  document.getElementById('ranking-detail-wrap').style.display='none';
}

/* ═══════════════════════════════════════════════════════
   PAINEL ADMIN — INSERIR RESULTADOS OFICIAIS
═══════════════════════════════════════════════════════ */
let adminGroupOpen = false;

function toggleAdminResults(){
  const panel = document.getElementById('admin-results-panel');
  adminGroupOpen = !adminGroupOpen;
  panel.style.display = adminGroupOpen ? 'block' : 'none';
  if(adminGroupOpen) populateAdminGroupSelect();
}

function activateAdmin(){
  const pw = prompt('Senha do administrador:');
  if(!pw) return;
  if(hashPw(pw)===ADMIN_PW_HASH){
    localStorage.setItem('bolao_admin','1');
    document.getElementById('btn-admin-results').style.display='block';
    toast('✔ Modo admin ativado!','ok');
  } else {
    toast('❌ Senha incorreta','err');
  }
}

let adminTapCount=0, adminTapTimer=null;
document.addEventListener('DOMContentLoaded',()=>{
  const rtitle = document.querySelector('.ranking-title');
  if(rtitle){
    rtitle.addEventListener('click',()=>{
      adminTapCount++;
      clearTimeout(adminTapTimer);
      adminTapTimer=setTimeout(()=>adminTapCount=0, 800);
      if(adminTapCount>=5){adminTapCount=0;activateAdmin();}
    });
  }
});

function saveOfficialGameResult(matchId){
  const h = document.getElementById(`of-h-${matchId}`).value;
  const a = document.getElementById(`of-a-${matchId}`).value;
  if(h===''||a===''){toast('⚠ Preencha os dois placares!','err');return;}
  saveOfficialResult(matchId, h, a);
  renderAdminGames();
  renderRanking();
  toast('✔ Resultado salvo!','ok');
}
/* ═══════════════════════════════════════════════════════
   MATA-MATA DATA (KNOCKOUT STAGE)
   Estrutura completa com bloqueio por horário individual
═══════════════════════════════════════════════════════ */

const KNOCKOUT_ROUNDS = [
  {
    id: 'r16',
    label: 'Segunda Fase',
    short: 'R16',
    sides: ['left', 'left', 'left', 'left', 'left', 'left', 'left', 'left',
            'right','right','right','right','right','right','right','right'],
    matches: [
      // LADO ESQUERDO
      { id: 'KO_R16_1',  slot: 1,  side: 'left',  label: 'SF1',  h: { abbr:'ALE', f:'🇩🇪', n:'Alemanha'       }, a: { abbr:'PAR', f:'🇵🇾', n:'Paraguai'        }, dt:'29/Jun', tm:'17:30', dtISO:'2026-06-29T17:30:00-03:00' },
      { id: 'KO_R16_2',  slot: 2,  side: 'left',  label: 'SF2',  h: { abbr:'FRA', f:'🇫🇷', n:'França'         }, a: { abbr:'SUE', f:'🇸🇪', n:'Suécia'          }, dt:'30/Jun', tm:'18:00', dtISO:'2026-06-30T18:00:00-03:00' },
      { id: 'KO_R16_3',  slot: 3,  side: 'left',  label: 'SF3',  h: { abbr:'AFS', f:'🇿🇦', n:'África do Sul'  }, a: { abbr:'CAN', f:'🇨🇦', n:'Canadá'          }, dt:'28/Jun', tm:'16:00', dtISO:'2026-06-28T16:00:00-03:00' },
      { id: 'KO_R16_4',  slot: 4,  side: 'left',  label: 'SF4',  h: { abbr:'HOL', f:'🇳🇱', n:'Holanda'        }, a: { abbr:'MAR', f:'🇲🇦', n:'Marrocos'        }, dt:'29/Jun', tm:'22:00', dtISO:'2026-06-29T22:00:00-03:00' },
      { id: 'KO_R16_5',  slot: 5,  side: 'left',  label: 'SF5',  h: { abbr:'POR', f:'🇵🇹', n:'Portugal'       }, a: { abbr:'CRO', f:'🇭🇷', n:'Croácia'         }, dt:'02/Jul', tm:'20:00', dtISO:'2026-07-02T20:00:00-03:00' },
      { id: 'KO_R16_6',  slot: 6,  side: 'left',  label: 'SF6',  h: { abbr:'ESP', f:'🇪🇸', n:'Espanha'        }, a: { abbr:'AUT', f:'🇦🇹', n:'Áustria'         }, dt:'02/Jul', tm:'16:00', dtISO:'2026-07-02T16:00:00-03:00' },
      { id: 'KO_R16_7',  slot: 7,  side: 'left',  label: 'SF7',  h: { abbr:'EUA', f:'🇺🇸', n:'Estados Unidos' }, a: { abbr:'BOS', f:'🇧🇦', n:'Bósnia'          }, dt:'01/Jul', tm:'21:00', dtISO:'2026-07-01T21:00:00-03:00' },
      { id: 'KO_R16_8',  slot: 8,  side: 'left',  label: 'SF8',  h: { abbr:'BEL', f:'🇧🇪', n:'Bélgica'        }, a: { abbr:'SEN', f:'🇸🇳', n:'Senegal'         }, dt:'01/Jul', tm:'17:00', dtISO:'2026-07-01T17:00:00-03:00' },
      // LADO DIREITO
      { id: 'KO_R16_9',  slot: 9,  side: 'right', label: 'SF9',  h: { abbr:'BRA', f:'🇧🇷', n:'Brasil'         }, a: { abbr:'JAP', f:'🇯🇵', n:'Japão'           }, dt:'29/Jun', tm:'14:00', dtISO:'2026-06-29T14:00:00-03:00' },
      { id: 'KO_R16_10', slot: 10, side: 'right', label: 'SF10', h: { abbr:'CMA', f:'🇨🇮', n:'Costa do Marfim'}, a: { abbr:'NOR', f:'🇳🇴', n:'Noruega'         }, dt:'30/Jun', tm:'14:00', dtISO:'2026-06-30T14:00:00-03:00' },
      { id: 'KO_R16_11', slot: 11, side: 'right', label: 'SF11', h: { abbr:'MEX', f:'🇲🇽', n:'México'         }, a: { abbr:'EQU', f:'🇪🇨', n:'Equador'         }, dt:'30/Jun', tm:'22:00', dtISO:'2026-06-30T22:00:00-03:00' },
      { id: 'KO_R16_12', slot: 12, side: 'right', label: 'SF12', h: { abbr:'ING', f:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', n:'Inglaterra'     }, a: { abbr:'RDC', f:'🇨🇩', n:'RD Congo'        }, dt:'01/Jul', tm:'13:00', dtISO:'2026-07-01T13:00:00-03:00' },
      { id: 'KO_R16_13', slot: 13, side: 'right', label: 'SF13', h: { abbr:'ARG', f:'🇦🇷', n:'Argentina'      }, a: { abbr:'CBV', f:'🇨🇻', n:'Cabo Verde'      }, dt:'03/Jul', tm:'19:00', dtISO:'2026-07-03T19:00:00-03:00' },
      { id: 'KO_R16_14', slot: 14, side: 'right', label: 'SF14', h: { abbr:'AUS', f:'🇦🇺', n:'Austrália'      }, a: { abbr:'EGI', f:'🇪🇬', n:'Egito'           }, dt:'03/Jul', tm:'15:00', dtISO:'2026-07-03T15:00:00-03:00' },
      { id: 'KO_R16_15', slot: 15, side: 'right', label: 'SF15', h: { abbr:'SUI', f:'🇨🇭', n:'Suíça'          }, a: { abbr:'AGL', f:'🇩🇿', n:'Argélia'         }, dt:'03/Jul', tm:'00:00', dtISO:'2026-07-03T00:00:00-03:00' },
      { id: 'KO_R16_16', slot: 16, side: 'right', label: 'SF16', h: { abbr:'COL', f:'🇨🇴', n:'Colômbia'       }, a: { abbr:'GAN', f:'🇬🇭', n:'Gana'            }, dt:'03/Jul', tm:'22:30', dtISO:'2026-07-03T22:30:00-03:00' },
    ]
  },
  {
    id: 'qf',
    label: 'Oitavas de Final',
    short: 'OIT',
    matches: [
      { id: 'KO_QF_1', slot: 1, side: 'left',  label: 'OIT1', feedFrom: ['KO_R16_1','KO_R16_2'],   dt:'04/Jul', tm:'18:00', dtISO:'2026-07-04T18:00:00-03:00' },
      { id: 'KO_QF_2', slot: 2, side: 'left',  label: 'OIT2', feedFrom: ['KO_R16_3','KO_R16_4'],   dt:'04/Jul', tm:'14:00', dtISO:'2026-07-04T14:00:00-03:00' },
      { id: 'KO_QF_3', slot: 3, side: 'left',  label: 'OIT3', feedFrom: ['KO_R16_5','KO_R16_6'],   dt:'06/Jul', tm:'16:00', dtISO:'2026-07-06T16:00:00-03:00' },
      { id: 'KO_QF_4', slot: 4, side: 'left',  label: 'OIT4', feedFrom: ['KO_R16_7','KO_R16_8'],   dt:'06/Jul', tm:'21:00', dtISO:'2026-07-06T21:00:00-03:00' },
      { id: 'KO_QF_5', slot: 5, side: 'right', label: 'OIT5', feedFrom: ['KO_R16_9','KO_R16_10'],  dt:'05/Jul', tm:'17:00', dtISO:'2026-07-05T17:00:00-03:00' },
      { id: 'KO_QF_6', slot: 6, side: 'right', label: 'OIT6', feedFrom: ['KO_R16_11','KO_R16_12'], dt:'05/Jul', tm:'21:00', dtISO:'2026-07-05T21:00:00-03:00' },
      { id: 'KO_QF_7', slot: 7, side: 'right', label: 'OIT7', feedFrom: ['KO_R16_13','KO_R16_14'], dt:'07/Jul', tm:'13:00', dtISO:'2026-07-07T13:00:00-03:00' },
      { id: 'KO_QF_8', slot: 8, side: 'right', label: 'OIT8', feedFrom: ['KO_R16_15','KO_R16_16'], dt:'07/Jul', tm:'17:00', dtISO:'2026-07-07T17:00:00-03:00' },
    ]
  },
  {
    id: 'sf',
    label: 'Quartas de Final',
    short: 'QTF',
    matches: [
      { id: 'KO_SF_1', slot: 1, side: 'left',  label: 'QTF1', feedFrom: ['KO_QF_1','KO_QF_2'], dt:'09/Jul', tm:'17:00', dtISO:'2026-07-09T17:00:00-03:00' },
      { id: 'KO_SF_2', slot: 2, side: 'left',  label: 'QTF2', feedFrom: ['KO_QF_3','KO_QF_4'], dt:'10/Jul', tm:'16:00', dtISO:'2026-07-10T16:00:00-03:00' },
      { id: 'KO_SF_3', slot: 3, side: 'right', label: 'QTF3', feedFrom: ['KO_QF_5','KO_QF_6'], dt:'11/Jul', tm:'18:00', dtISO:'2026-07-11T18:00:00-03:00' },
      { id: 'KO_SF_4', slot: 4, side: 'right', label: 'QTF4', feedFrom: ['KO_QF_7','KO_QF_8'], dt:'11/Jul', tm:'22:00', dtISO:'2026-07-11T22:00:00-03:00' },
    ]
  },
  {
    id: 'f',
    label: 'Semifinal',
    short: 'SEMI',
    matches: [
      { id: 'KO_F_1', slot: 1, side: 'left',  label: 'SEMI1', feedFrom: ['KO_SF_1','KO_SF_2'], dt:'14/Jul', tm:'16:00', dtISO:'2026-07-14T16:00:00-03:00' },
      { id: 'KO_F_2', slot: 2, side: 'right', label: 'SEMI2', feedFrom: ['KO_SF_3','KO_SF_4'], dt:'15/Jul', tm:'16:00', dtISO:'2026-07-15T16:00:00-03:00' },
    ]
  },
  {
    id: 'finals',
    label: 'Finais',
    short: 'FIN',
    matches: [
      { id: 'KO_3RD',   slot: 1, side: 'left',  label: '3LUG',  feedFrom: ['KO_F_1','KO_F_2'], feedLoser: true, dt:'18/Jul', tm:'18:00', dtISO:'2026-07-18T18:00:00-03:00' },
      { id: 'KO_FINAL', slot: 2, side: 'right', label: 'FINAL', feedFrom: ['KO_F_1','KO_F_2'], dt:'19/Jul', tm:'16:00', dtISO:'2026-07-19T16:00:00-03:00' },
    ]
  }
];

// Flat list de todos os IDs do mata-mata (para contagem global)
const ALL_KO_IDS = KNOCKOUT_ROUNDS.flatMap(r => r.matches.map(m => m.id));

/* ═══════════════════════════════════════════════════════
   HELPERS DO MATA-MATA
═══════════════════════════════════════════════════════ */

function koGameIsLocked(match) {
  return new Date() >= new Date(match.dtISO);
}

function getKoSc(user, id) {
  const sc = cloudLoaded ? cloudState.scores : getScores();
  return (sc[user] && sc[user][id] != null) ? sc[user][id] : null;
}

// 🔴 CORREÇÃO: agora repassa "winner" para syncToCloud, que antes
// descartava esse dado silenciosamente (assinatura só aceitava h, a).
function saveKoSc(user, id, h, a, winner = null) {
  const sc = getScores();
  if (!sc[user]) sc[user] = {};
  sc[user][id] = { h, a, winner };
  saveScores(sc);
  if (!cloudState.scores[user]) cloudState.scores[user] = {};
  cloudState.scores[user][id] = { h, a, winner };
  syncToCloud(user, id, h, a, winner);
}

// Retorna o time "vencedor" de um jogo KO:
// 1. Campo `winner` explícito ('h'/'a') → pênaltis ou prorrogação
// 2. Senão deduz pelo placar
function getKoWinner(matchId) {
  const results = cloudLoaded ? cloudState.oficiais : getOfficialResults();
  const r = results[matchId];
  if (!r || r.h === '' || r.a === '') return null;
  const m = findKoMatch(matchId);
  if (!m) return null;
  const teams = resolveKoTeams(m);
  if (r.winner === 'h') return teams.h;
  if (r.winner === 'a') return teams.a;
  const ph = parseInt(r.h), pa = parseInt(r.a);
  if (ph > pa) return teams.h;
  if (pa > ph) return teams.a;
  return null; // empate sem winner definido
}

function getKoLoser(matchId) {
  const results = cloudLoaded ? cloudState.oficiais : getOfficialResults();
  const r = results[matchId];
  if (!r || r.h === '' || r.a === '') return null;
  const m = findKoMatch(matchId);
  if (!m) return null;
  const teams = resolveKoTeams(m);
  if (r.winner === 'h') return teams.a;
  if (r.winner === 'a') return teams.h;
  const ph = parseInt(r.h), pa = parseInt(r.a);
  if (ph > pa) return teams.a;
  if (pa > ph) return teams.h;
  return null;
}

// Vencedor do palpite do usuário (para alimentar fases seguintes no preview)
function getKoWinnerFromPalpite(matchId, user) {
  const scores = cloudLoaded ? cloudState.scores : getScores();
  const sc = scores[user]?.[matchId];
  if (!sc || sc.h === '' || sc.a === '') return null;
  const m = findKoMatch(matchId);
  if (!m) return null;
  const teams = resolveKoTeams(m);
  if (sc.winner === 'h') return teams.h;
  if (sc.winner === 'a') return teams.a;
  const ph = parseInt(sc.h), pa = parseInt(sc.a);
  if (ph > pa) return teams.h;
  if (pa > ph) return teams.a;
  return null;
}

function findKoMatch(id) {
  for (const round of KNOCKOUT_ROUNDS) {
    const m = round.matches.find(x => x.id === id);
    if (m) return m;
  }
  return null;
}

// Resolve os times de uma partida KO (considerando feedFrom)
function resolveKoTeams(match) {
  if (match.h && match.a) return { h: match.h, a: match.a }; // times fixos (R16)

  // Times derivados de resultados anteriores
  const [srcA, srcB] = match.feedFrom || [];
  let teamA = null, teamB = null;

  if (match.feedLoser) {
    // Disputa 3º lugar: perdedores das semis
    teamA = srcA ? getKoLoser(srcA) : null;
    teamB = srcB ? getKoLoser(srcB) : null;
  } else {
    teamA = srcA ? getKoWinner(srcA) : null;
    teamB = srcB ? getKoWinner(srcB) : null;
  }

  const labelA = match.feedLoser ? `Perd. ${srcA ? findKoMatch(srcA)?.label : '?'}` : `Venc. ${srcA ? findKoMatch(srcA)?.label : '?'}`;
  const labelB = match.feedLoser ? `Perd. ${srcB ? findKoMatch(srcB)?.label : '?'}` : `Venc. ${srcB ? findKoMatch(srcB)?.label : '?'}`;

  return {
    h: teamA || { abbr: '?', f: '⚽', n: labelA },
    a: teamB || { abbr: '?', f: '⚽', n: labelB }
  };
}

/* ═══════════════════════════════════════════════════════
   TELA MATA-MATA — NAVEGAÇÃO
═══════════════════════════════════════════════════════ */
let koState = { roundIdx: 0, matchIdx: null };

function showKnockout() {
  koState.roundIdx = 0;
  renderKnockoutBracket();
  show('s-knockout');
}

function renderKnockoutBracket() {
  const container = document.getElementById('ko-bracket');
  if (!container) return;

  // Tabs de fase
  const tabsEl = document.getElementById('ko-tabs');
  if (tabsEl) {
    tabsEl.innerHTML = KNOCKOUT_ROUNDS.map((r, i) => `
      <button class="ko-tab${i === koState.roundIdx ? ' active' : ''}" onclick="selectKoRound(${i})">
        ${r.short}
      </button>
    `).join('');
  }

  const round = KNOCKOUT_ROUNDS[koState.roundIdx];
  const isFinals = round.id === 'finals';

  let html = `<div class="ko-round-title">${round.label}</div>`;

  if (isFinals) {
    // Layout especial para finais (3º lugar + final lado a lado)
    html += `<div class="ko-finals-wrap">`;
    round.matches.forEach(match => {
      html += renderKoMatchCard(match, true);
    });
    html += `</div>`;
  } else {
    // Layout 2 colunas (esquerda / direita)
    const leftMatches  = round.matches.filter(m => m.side === 'left');
    const rightMatches = round.matches.filter(m => m.side === 'right');

    html += `<div class="ko-two-col">
      <div class="ko-col ko-col-left">
        <div class="ko-col-label">LADO ESQUERDO</div>
        ${leftMatches.map(m => renderKoMatchCard(m, false)).join('')}
      </div>
      <div class="ko-col ko-col-right">
        <div class="ko-col-label">LADO DIREITO</div>
        ${rightMatches.map(m => renderKoMatchCard(m, false)).join('')}
      </div>
    </div>`;
  }

  container.innerHTML = html;
  updateKoProgress();
}

function renderKoMatchCard(match, isFinal) {
  const teams = resolveKoTeams(match);
  const locked = koGameIsLocked(match);
  const sc = getKoSc(S.user, match.id);
  const hv = sc ? sc.h : '';
  const av = sc ? sc.a : '';
  const savedWinner = sc ? (sc.winner || '') : '';
  const saved = hv !== '' && av !== '' && savedWinner !== '';
  const teamsKnown = teams.h.abbr !== '?' && teams.a.abbr !== '?';

  const results = cloudLoaded ? cloudState.oficiais : getOfficialResults();
  const official = results[match.id];
  const hasOfficial = official && official.h !== '' && official.a !== '';

  // Pontuação desta partida
  let scoreDisplay = '';
  if (hasOfficial) {
    const pts = calcPoints(sc, official);
    if (pts === 3)        scoreDisplay = `<span class="ko-pts exact">⚡ +3</span>`;
    else if (pts === 1.5) scoreDisplay = `<span class="ko-pts partial">✓ +1.5</span>`;
    else if (pts === 0)   scoreDisplay = `<span class="ko-pts miss">✗ 0</span>`;
  }

  const isFinalMatch = match.id === 'KO_FINAL';
  const is3rd        = match.id === 'KO_3RD';

  // Bloco de empate: qual time avança? (pênaltis/prorrogação)
  // Mostra sempre que os times são conhecidos e o jogo não está bloqueado
  const showWinnerPicker = teamsKnown && !locked;

  // Quando bloqueado, mostra quem o usuário escolheu como vencedor
  let lockedWinnerLine = '';
  if (locked && teamsKnown && hv !== '' && av !== '') {
    const chosenName = savedWinner === 'h' ? teams.h.n : savedWinner === 'a' ? teams.a.n : '—';
    const chosenFlag = savedWinner === 'h' ? teams.h.f : savedWinner === 'a' ? teams.a.f : '';
    lockedWinnerLine = `<div class="ko-winner-chosen">🏆 Avança: ${chosenFlag} ${chosenName}</div>`;
  }

  // Resultado oficial: vencedor real
  let officialWinnerLine = '';
  if (hasOfficial) {
    const officialWinner = getKoWinner(match.id);
    if (officialWinner) {
      officialWinnerLine = `<div class="ko-official-winner">✅ Vencedor: ${officialWinner.f} ${officialWinner.n}</div>`;
    } else {
      officialWinnerLine = `<div class="ko-official-winner pending">⏳ Aguardando desempate</div>`;
    }
  }

  return `
  <div class="ko-match-card${saved ? ' saved' : ''}${isFinalMatch ? ' ko-grand-final' : ''}${is3rd ? ' ko-third' : ''}" id="ko-card-${match.id}">
    <div class="ko-match-header">
      <span class="ko-match-label">${isFinalMatch ? '🏆 GRANDE FINAL' : is3rd ? '🥉 3º LUGAR' : match.label}</span>
      <span class="ko-match-date">📅 ${match.dt} · ⏰ ${match.tm}</span>
    </div>

    <div class="ko-match-body">
      <div class="ko-team ko-team-h">
        <span class="ko-flag">${teams.h.f}</span>
        <span class="ko-tname">${teams.h.n}</span>
      </div>

      <div class="ko-score-center">
        ${!teamsKnown ? `<span class="ko-pending-label">Aguardando<br>fase anterior</span>` : locked ? `
          <div class="ko-score-inputs locked">
            <span class="ko-score-val">${hv !== '' ? hv : '–'}</span>
            <span class="ko-xsep">×</span>
            <span class="ko-score-val">${av !== '' ? av : '–'}</span>
          </div>
          ${lockedWinnerLine}
          ${hasOfficial ? `<div class="ko-official-score">Oficial: ${official.h}×${official.a}</div>` : ''}
          ${officialWinnerLine}
          ${scoreDisplay}
        ` : `
          <div class="ko-score-inputs">
            <input class="ko-sin" type="number" min="0" max="30" id="ko-h-${match.id}" value="${hv}" placeholder="–"
              oninput="onKoInput('${match.id}')">
            <span class="ko-xsep">×</span>
            <input class="ko-sin" type="number" min="0" max="30" id="ko-a-${match.id}" value="${av}" placeholder="–"
              oninput="onKoInput('${match.id}')">
          </div>
          <button class="ko-btn-save" onclick="saveKoGame('${match.id}')">💾 Salvar</button>
        `}
      </div>

      <div class="ko-team ko-team-a">
        <span class="ko-flag">${teams.a.f}</span>
        <span class="ko-tname">${teams.a.n}</span>
      </div>
    </div>

    ${showWinnerPicker ? `
      <div class="ko-winner-picker" id="wp-${match.id}">
        <div class="ko-winner-label">🏆 Quem avança? <span class="ko-winner-hint">(obrigatório — vale para pênaltis)</span></div>
        <div class="ko-winner-options">
          <label class="ko-winner-opt${savedWinner === 'h' ? ' selected' : ''}">
            <input type="radio" name="winner-${match.id}" value="h" ${savedWinner === 'h' ? 'checked' : ''}
              onchange="onWinnerChange('${match.id}')">
            <span class="ko-wopt-flag">${teams.h.f}</span>
            <span class="ko-wopt-name">${teams.h.n}</span>
          </label>
          <label class="ko-winner-opt${savedWinner === 'a' ? ' selected' : ''}">
            <input type="radio" name="winner-${match.id}" value="a" ${savedWinner === 'a' ? 'checked' : ''}
              onchange="onWinnerChange('${match.id}')">
            <span class="ko-wopt-flag">${teams.a.f}</span>
            <span class="ko-wopt-name">${teams.a.n}</span>
          </label>
        </div>
      </div>
    ` : ''}

    ${saved && !locked ? `<div class="ko-saved-badge">✔ Salvo</div>` : ''}
    ${!saved && !locked && teamsKnown ? `<div class="ko-unsaved-hint">Preencha o placar e escolha quem avança</div>` : ''}
    ${locked && !teamsKnown ? `<div class="ko-lock-note">🔒 Bloqueado</div>` : ''}
  </div>`;
}

function selectKoRound(idx) {
  koState.roundIdx = idx;
  renderKnockoutBracket();
}

function onKoInput(id) {
  // Auto-save só quando placar E vencedor estiverem preenchidos
  const h = document.getElementById(`ko-h-${id}`)?.value;
  const a = document.getElementById(`ko-a-${id}`)?.value;
  const winnerEl = document.querySelector(`input[name="winner-${id}"]:checked`);
  if (h !== '' && a !== '' && winnerEl) saveKoGame(id, true);
}

function onWinnerChange(id) {
  // Re-estiliza as opções e tenta salvar
  const opts = document.querySelectorAll(`#wp-${id} .ko-winner-opt`);
  opts.forEach(opt => {
    const radio = opt.querySelector('input[type="radio"]');
    opt.classList.toggle('selected', radio.checked);
  });
  const h = document.getElementById(`ko-h-${id}`)?.value;
  const a = document.getElementById(`ko-a-${id}`)?.value;
  if (h !== '' && a !== '') saveKoGame(id, true);
}

function saveKoGame(id, silent = false) {
  const match = findKoMatch(id);
  if (!match) return;
  if (koGameIsLocked(match)) { toast('🔒 Partida já iniciada! Não é possível alterar.', 'err'); return; }

  const teams = resolveKoTeams(match);
  if (teams.h.abbr === '?' || teams.a.abbr === '?') { toast('⏳ Times ainda não definidos!', 'err'); return; }

  const h = document.getElementById(`ko-h-${id}`)?.value.trim();
  const a = document.getElementById(`ko-a-${id}`)?.value.trim();
  const winnerEl = document.querySelector(`input[name="winner-${id}"]:checked`);
  const winner = winnerEl ? winnerEl.value : null;

  if (h === '' || a === '') {
    if (!silent) toast('⚠ Preencha o placar!', 'err');
    return;
  }
  if (!winner) {
    if (!silent) toast('⚠ Escolha quem avança!', 'err');
    return;
  }

  saveKoSc(S.user, id, h, a, winner);

  const card = document.getElementById(`ko-card-${id}`);
  if (card) card.classList.add('saved');
  // Remove hint de não salvo
  const hint = card?.querySelector('.ko-unsaved-hint');
  if (hint) hint.remove();

  if (!silent) toast('✔ Palpite do mata-mata salvo!', 'ok');
  updateKoProgress();
}

function updateKoProgress() {
  const total = ALL_KO_IDS.length;
  const done = ALL_KO_IDS.filter(id => {
    const s = getKoSc(S.user, id);
    return s && s.h !== '' && s.a !== '';
  }).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  const lbl = document.getElementById('ko-prog-lbl');
  const pct_el = document.getElementById('ko-prog-pct');
  const fill = document.getElementById('ko-prog-fill');
  if (lbl) lbl.textContent = `${done}/${total} palpites`;
  if (pct_el) pct_el.textContent = `${pct}%`;
  if (fill) fill.style.width = `${pct}%`;
}

/* ═══════════════════════════════════════════════════════
   RANKING (fase de grupos + mata-mata combinados)
   ───────────────────────────────────────────────────────
   🔴 CORREÇÃO: a lista de participantes (allUsers) agora é
   construída A PARTIR de quem tem palpites salvos na nuvem
   (Object.keys(scores)) — não só da aba "Usuarios". Antes,
   se o registro de login falhasse silenciosamente (ver
   syncLoginToCloud), o jogador sumia do ranking mesmo tendo
   todos os palpites computados corretamente nos bastidores.
═══════════════════════════════════════════════════════ */
function buildRanking() {
  const scores  = cloudLoaded ? cloudState.scores : getScores();
  const results = cloudLoaded ? cloudState.oficiais : getOfficialResults();

  const playersFromScores   = Object.keys(scores);
  const playersFromRegistry = cloudState.usuarios || [];
  const localUsers          = Object.keys(getUsers());

  const allUsers = [...new Set([...playersFromScores, ...playersFromRegistry, ...localUsers])].filter(Boolean);

  const matchesWithResult = Object.keys(results).length;

  const ranking = allUsers.map(user => {
    let pts = 0, exact = 0, partial = 0, miss = 0, pending = 0;

    // Pontos da fase de grupos
    ALL_IDS.forEach(id => {
      const palpite = scores[user] ? scores[user][id] : null;
      const oficial = results[id];
      const p = calcPoints(palpite, oficial);
      if      (p === 3)   { pts += 3; exact++; }
      else if (p === 1.5) { pts += 1.5; partial++; }
      else if (p === 0)   { miss++; }
      else if (oficial && oficial.h !== '' && oficial.a !== '') { miss++; }
      else                { pending++; }
    });

    // Pontos do mata-mata (lógica especial: empate no placar → verifica winner)
    ALL_KO_IDS.forEach(id => {
      const palpite = scores[user] ? scores[user][id] : null;
      const oficial = results[id];
      if (!palpite || palpite.h === '' || palpite.a === '' || !palpite.winner) return;
      if (!oficial  || oficial.h  === '' || oficial.a  === '') { pending++; return; }

      const ph = parseInt(palpite.h), pa = parseInt(palpite.a);
      const oh = parseInt(oficial.h),  oa = parseInt(oficial.a);

      // Placar exato E vencedor correto = 3 pts
      if (ph === oh && pa === oa && palpite.winner === oficial.winner) {
        pts += 3; exact++; return;
      }
      // Resultado parcial: acertou quem avança (seja pelo placar ou pelo campo winner)
      const pWinner = ph > pa ? 'h' : ph < pa ? 'a' : palpite.winner;
      const oWinner = oficial.winner || (oh > oa ? 'h' : oh < oa ? 'a' : null);
      if (oWinner && pWinner === oWinner) {
        pts += 1.5; partial++; return;
      }
      miss++;
    });

    const allMatchIds = [...ALL_IDS, ...ALL_KO_IDS];
    const filled = allMatchIds.filter(id => {
      const s = scores[user]?.[id];
      return s && s.h !== '' && s.a !== '';
    }).length;

    return { user, pts, exact, partial, miss, pending, filled };
  });

  ranking.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.exact !== a.exact ? b.exact - a.exact : a.user.localeCompare(b.user));
  return { ranking, matchesWithResult };
}

/* ═══════════════════════════════════════════════════════
   ADMIN: dropdown com grupos + fases do mata-mata
═══════════════════════════════════════════════════════ */
function populateAdminGroupSelect() {
  const sel = document.getElementById('admin-group-sel');
  if (!sel || sel.options.length > 1) return;
  Object.keys(GROUPS).forEach(letter => {
    const opt = document.createElement('option');
    opt.value = letter;
    opt.textContent = `Grupo ${letter}`;
    sel.appendChild(opt);
  });
  KNOCKOUT_ROUNDS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = 'KO_' + r.id;
    opt.textContent = `🏆 ${r.label}`;
    sel.appendChild(opt);
  });
}

/* ═══════════════════════════════════════════════════════
   RANKING DETAIL: palpites da fase de grupos + mata-mata
═══════════════════════════════════════════════════════ */
function showUserDetail(user) {
  const results = cloudLoaded ? cloudState.oficiais : getOfficialResults();
  const scores  = cloudLoaded ? cloudState.scores : getScores();

  const wrap = document.getElementById('ranking-detail-wrap');
  const ttl  = document.getElementById('rd-title');
  const lst  = document.getElementById('ranking-detail-list');

  ttl.textContent = `📋 Palpites de ${user}`;

  const rows = [];

  // ── FASE DE GRUPOS ──────────────────────────────────
  rows.push(`<div class="detail-section-title">⚽ Fase de Grupos</div>`);

  Object.entries(MATCHES).forEach(([letter, rds]) => {
    rds.forEach(rd => {
      rd.games.forEach(g => {
        const palpite = scores[user] ? scores[user][g.id] : null;
        const oficial = results[g.id];
        const p = calcPoints(palpite, oficial);
        const hasPalpite = palpite && palpite.h !== '' && palpite.a !== '';
        const hasResult  = oficial  && oficial.h !== '' && oficial.a !== '';

        let icon, ptsCls, ptsLbl, resultTxt = '';
        if      (p === 3)   { icon = '⚡'; ptsCls = 'exact';   ptsLbl = '+3';   }
        else if (p === 1.5) { icon = '✓';  ptsCls = 'partial'; ptsLbl = '+1.5'; }
        else if (p === 0)   { icon = '✗';  ptsCls = 'miss';    ptsLbl = '0';    }
        else if (!hasPalpite) { icon = '—'; ptsCls = 'miss';   ptsLbl = '—';    }
        else                { icon = '⏳'; ptsCls = 'pending'; ptsLbl = '...';  }

        if (hasResult) resultTxt = `Oficial: ${g.h.f}${oficial.h}×${oficial.a}${g.a.f}`;

        const isLocked = gameIsLocked(g);
        let textoPalpite = 'Sem palpite';
        if (hasPalpite) {
          if (isLocked || user === S.user) {
            textoPalpite = `Palpite: ${palpite.h}×${palpite.a}`;
          } else {
            textoPalpite = `🔒 Oculto até o início`;
          }
        }

        rows.push(`<div class="detail-match">
          <div class="dm-icon">${icon}</div>
          <div style="flex:1;min-width:0">
            <div class="dm-teams">${g.h.f} ${g.h.n} × ${g.a.f} ${g.a.n}</div>
            <div class="dm-palpite">${textoPalpite}</div>
            ${resultTxt ? `<div class="dm-result" style="color:var(--teal);font-size:.7rem">${resultTxt}</div>` : ''}
          </div>
          <div class="dm-pts ${ptsCls}">${ptsLbl}</div>
        </div>`);
      });
    });
  });

  // ── MATA-MATA ────────────────────────────────────────
  rows.push(`<div class="detail-section-title ko-section-title">⚔️ Palpites Mata-Mata</div>`);

  KNOCKOUT_ROUNDS.forEach(round => {
    rows.push(`<div class="detail-ko-phase">${round.label}</div>`);

    round.matches.forEach(g => {
      const teams = resolveKoTeams(g);
      const palpite = scores[user] ? scores[user][g.id] : null;
      const oficial = results[g.id];
      const p = calcPoints(palpite, oficial);
      const hasPalpite = palpite && palpite.h !== '' && palpite.a !== '';
      const hasResult  = oficial  && oficial.h !== '' && oficial.a !== '';
      const teamsKnown = teams.h.abbr !== '?' && teams.a.abbr !== '?';

      let icon, ptsCls, ptsLbl, resultTxt = '';
      if      (p === 3)   { icon = '⚡'; ptsCls = 'exact';   ptsLbl = '+3';   }
      else if (p === 1.5) { icon = '✓';  ptsCls = 'partial'; ptsLbl = '+1.5'; }
      else if (p === 0)   { icon = '✗';  ptsCls = 'miss';    ptsLbl = '0';    }
      else if (!hasPalpite) { icon = '—'; ptsCls = 'miss';   ptsLbl = '—';    }
      else                { icon = '⏳'; ptsCls = 'pending'; ptsLbl = '...';  }

      if (hasResult) resultTxt = `Oficial: ${oficial.h}×${oficial.a}`;

      const isLocked = koGameIsLocked(g);
      let textoPalpite = 'Sem palpite';
      if (!teamsKnown) {
        textoPalpite = '⏳ Aguardando fase anterior';
      } else if (hasPalpite) {
        if (isLocked || user === S.user) {
          textoPalpite = `Palpite: ${palpite.h}×${palpite.a}`;
        } else {
          textoPalpite = `🔒 Oculto até o início`;
        }
      }

      const teamLine = teamsKnown
        ? `${teams.h.f} ${teams.h.n} × ${teams.a.f} ${teams.a.n}`
        : `${g.label} — ${g.dt} · ${g.tm}`;

      rows.push(`<div class="detail-match">
        <div class="dm-icon">${icon}</div>
        <div style="flex:1;min-width:0">
          <div class="dm-teams">${teamLine}</div>
          <div class="dm-palpite">${textoPalpite}</div>
          ${resultTxt ? `<div class="dm-result" style="color:var(--teal);font-size:.7rem">${resultTxt}</div>` : ''}
        </div>
        <div class="dm-pts ${ptsCls}">${ptsLbl}</div>
      </div>`);
    });
  });

  lst.innerHTML = rows.join('');
  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════════════════════════════════════════════
   ADMIN: lista de jogos (grupos OU mata-mata) para inserir
   resultados oficiais
═══════════════════════════════════════════════════════ */
function renderAdminGames() {
  const letter = document.getElementById('admin-group-sel').value;
  const container = document.getElementById('admin-games-list');
  if (!letter) { container.innerHTML = ''; return; }

  // Se for mata-mata
  if (letter.startsWith('KO_')) {
    const roundId = letter.replace('KO_', '');
    const round = KNOCKOUT_ROUNDS.find(r => r.id === roundId);
    if (!round) { container.innerHTML = ''; return; }

    const results = getOfficialResults();
    let html = '';
    round.matches.forEach(g => {
      const teams = resolveKoTeams(g);
      const of = results[g.id];
      const hv = of ? of.h : '';
      const av = of ? of.a : '';
      const ow = of ? (of.winner || '') : '';
      const savedMark = (hv !== '' && av !== '' && ow !== '') ? `<span class="agr-saved">✔ salvo</span>` : '';
      const teamsKnown = teams.h.abbr !== '?' && teams.a.abbr !== '?';

      html += `<div class="admin-game-row" style="flex-direction:column;align-items:stretch;gap:.5rem">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <div class="agr-teams">${teams.h.f} ${teams.h.n} × ${teams.a.f} ${teams.a.n}</div>
            <div class="agr-date">${g.dt} · ${g.tm} — ${g.label}</div>
          </div>
          <div class="agr-score">
            <input class="agr-sin" type="number" min="0" max="30" id="of-h-${g.id}" value="${hv}" placeholder="—">
            <span class="agr-sep">×</span>
            <input class="agr-sin" type="number" min="0" max="30" id="of-a-${g.id}" value="${av}" placeholder="—">
            <button class="btn-save-result" onclick="saveOfficialKoResult('${g.id}')">Salvar</button>
            ${savedMark}
          </div>
        </div>
        ${teamsKnown ? `
        <div class="agr-winner-row">
          <span class="agr-winner-label">🏆 Vencedor oficial:</span>
          <label class="agr-winner-opt${ow === 'h' ? ' sel' : ''}">
            <input type="radio" name="agr-w-${g.id}" value="h" ${ow === 'h' ? 'checked' : ''}
              onchange="onAdminWinnerChange('${g.id}')">
            ${teams.h.f} ${teams.h.n}
          </label>
          <label class="agr-winner-opt${ow === 'a' ? ' sel' : ''}">
            <input type="radio" name="agr-w-${g.id}" value="a" ${ow === 'a' ? 'checked' : ''}
              onchange="onAdminWinnerChange('${g.id}')">
            ${teams.a.f} ${teams.a.n}
          </label>
          <span class="agr-winner-hint">(use quando houver pênaltis/prorrogação)</span>
        </div>` : `<div class="agr-winner-hint" style="padding-left:.3rem">Times ainda não definidos</div>`}
      </div>`;
    });
    container.innerHTML = html;
    return;
  }

  // Fase de grupos
  const results = getOfficialResults();
  const rounds  = MATCHES[letter];
  if (!rounds) { container.innerHTML = ''; return; }

  let html = '';
  rounds.forEach(rd => {
    html += `<div style="font-family:'Bebas Neue',sans-serif;font-size:.95rem;color:var(--gold);padding:.6rem .3rem .2rem;letter-spacing:.05em">RODADA ${rd.r}</div>`;
    rd.games.forEach(g => {
      const of = results[g.id];
      const hv = of ? of.h : '';
      const av = of ? of.a : '';
      const savedMark = (hv !== '' && av !== '') ? `<span class="agr-saved">✔ salvo</span>` : '';
      html += `<div class="admin-game-row">
        <div style="flex:1;min-width:140px">
          <div class="agr-teams">${g.h.f} ${g.h.n} × ${g.a.f} ${g.a.n}</div>
          <div class="agr-date">${g.dt} · ${g.tm}</div>
        </div>
        <div class="agr-score">
          <input class="agr-sin" type="number" min="0" max="30" id="of-h-${g.id}" value="${hv}" placeholder="—">
          <span class="agr-sep">×</span>
          <input class="agr-sin" type="number" min="0" max="30" id="of-a-${g.id}" value="${av}" placeholder="—">
          <button class="btn-save-result" onclick="saveOfficialGameResult('${g.id}')">Salvar</button>
          ${savedMark}
        </div>
      </div>`;
    });
  });
  container.innerHTML = html;
}

/* ═══════════════════════════════════════════════════════
   ADMIN KO: salvar resultado oficial com vencedor
═══════════════════════════════════════════════════════ */

function onAdminWinnerChange(matchId) {
  const radios = document.querySelectorAll(`input[name="agr-w-${matchId}"]`);
  radios.forEach(r => {
    r.closest('label').classList.toggle('sel', r.checked);
  });
}

async function saveOfficialKoResult(matchId) {
  const h = document.getElementById(`of-h-${matchId}`)?.value;
  const a = document.getElementById(`of-a-${matchId}`)?.value;
  const winnerEl = document.querySelector(`input[name="agr-w-${matchId}"]:checked`);
  const winner = winnerEl ? winnerEl.value : null;

  if (h === '' || a === '') { toast('⚠ Preencha os dois placares!', 'err'); return; }
  if (!winner) { toast('⚠ Escolha o vencedor!', 'err'); return; }

  // Salva localmente (cache de leitura)
  const results = getOfficialResults();
  results[matchId] = { h, a, winner };
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));

  // Atualiza cloudState em memória (otimista, antes do próximo poll)
  if (!cloudState.oficiais) cloudState.oficiais = {};
  cloudState.oficiais[matchId] = { h, a, winner };

  // Envia ao Google Sheets — o backend agora persiste o campo winner
  // numa coluna própria, então ele não se perde no próximo loadFromCloud()
  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_official', match_id: matchId, score_home: h, score_away: a, winner })
      });
    } catch (e) { console.warn('Erro ao salvar resultado KO:', e); }
  }

  renderAdminGames();
  renderRanking();
  toast('✔ Resultado salvo!', 'ok');
}
