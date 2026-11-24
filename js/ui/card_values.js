// Numeric overlays only. Original PNGs remain untouched; coordinates are in their 1536×2048 canvas.
(function(root){
'use strict';
// Per-art ink bounds and the original cream/taupe background diagonal.
const layouts=[
 {"hp":[447,1341,343,182],"attack":[456,1183,144,120],"edge":[0.37794,1212.92]}, // Unicorn
 {"hp":[476,1355,358,192],"attack":[471,1193,176,110],"edge":[0.378,1212.89]}, // Sam
 {"hp":[467,1312,358,191],"attack":[487,1235,69,39],"edge":[0.37793,1212.93]}, // Sarck
 {"hp":[464,1337,336,186],"attack":[473,1189,144,115],"edge":[0.37794,1212.92]}, // Nully
 {"hp":[477,1339,304,193],"attack":[441,1190,192,124],"edge":[0.37794,1212.92]}, // Mike
 {"hp":[460,1333,361,190],"attack":[476,1199,139,111],"edge":[0.37791,1212.94]}, // Jonh
 {"hp":[454,1360,378,179],"attack":[430,1181,265,152],"edge":[0.37801,1212.89]}, // Zeneerian
 {"hp":[448,1318,368,183],"attack":[439,1189,191,123],"edge":[0.37795,1212.91]}, // Eletric
 {"hp":[474,1342,354,192],"attack":[453,1189,192,126],"edge":[0.37803,1212.87]}, // Penxy
 {"hp":[426,1331,431,193],"attack":[436,1183,216,120],"edge":[0.37803,1212.87]}, // Z-Zus
 {"hp":[453,1342,372,192],"attack":[452,1197,224,122],"edge":[0.37801,1212.89]}, // Chama
 {"hp":[431,1336,441,193],"attack":[423,1185,233,125],"edge":[0.37801,1212.89]}, // Daztirry
 {"hp":[443,1333,408,186],"attack":[449,1185,183,120],"edge":[0.37799,1212.89]}, // Zuri
 {"hp":[463,1333,342,190],"attack":[448,1185,183,113],"edge":[0.37794,1212.92]}, // Trucc
 {"hp":[475,1347,356,194],"attack":[460,1184,198,123],"edge":[0.378,1212.89]}, // Rawlin
 {"hp":[470,1356,331,180],"attack":[443,1188,232,142],"edge":[0.37792,1212.94]}, // Barn
 {"hp":[469,1351,370,199],"attack":[439,1184,282,142],"edge":[0.37797,1212.91]}, // Fomor
 {"hp":[459,1339,375,202],"attack":[466,1181,183,146],"edge":[0.37802,1212.88]}, // Elish
 {"hp":[486,1362,283,174],"attack":[507,1230,107,60],"edge":[0.37796,1212.91]}, // Sheriff · verde
 {"hp":[462,1351,289,173],"attack":[421,1183,254,127],"edge":[0.37793,1212.93]}, // Sheriff · roxo
 {"hp":[468,1356,324,170],"attack":[512,1230,100,56],"edge":[0.37788,1212.96]}, // Vaglar · preto
 {"hp":[458,1342,325,167],"attack":[498,1198,139,110],"edge":[0.37794,1212.93]}, // Vaglar · azul
 {"hp":[452,1352,336,180],"attack":[493,1194,206,126],"edge":[0.3779,1212.95]}, // DD-X
 {"hp":[452,1353,330,177],"attack":[482,1198,162,128],"edge":[0.3779,1212.95]}, // Rayyb
 {"hp":[498,1360,276,180],"attack":[442,1189,246,126],"edge":[0.37794,1212.92]}, // Endrik
 {"hp":[452,1357,322,167],"attack":[440,1185,202,132],"edge":[0.37792,1212.94]}, // Alex
 {"hp":[483,1359,271,169],"attack":[443,1185,227,126],"edge":[0.37793,1212.93]}, // P.ULLYS
 {"hp":[457,1364,330,170],"attack":[457,1186,199,126],"edge":[0.37792,1212.94]}, // Cavaleiro
 {"hp":[479,1360,276,180],"attack":[449,1185,207,127],"edge":[0.37794,1212.91]}, // Zikssy
 {"hp":[465,1345,330,180],"attack":[517,1225,95,53],"edge":[0.37796,1212.89]}, // Linx
 {"hp":[473,1356,319,167],"attack":[444,1187,211,130],"edge":[0.3779,1212.94]}, // Karma
 {"hp":[487,1355,264,168],"attack":[443,1187,239,144],"edge":[0.37792,1212.93]} // Draktar
];
function values(state,c){
 const total=root.GoghosBattleLab.attackPower(state,c),boosted=total!==c.atk;
 return {hp:c.hp,attack:total===null?'—':boosted?String(total):String(c.baseAtk)+(c.hits>1?'×'+c.hits:''),total,boosted};
}
function field(rect,value,kind,edge,color){
 const [x,y,w,h]=rect,[m,b]=edge;
 // Restore the two flat background colors and diagonal already present beneath the ink.
 const shade=kind==='hp'?'<path fill="#cabbb5" d="M 0 '+(b-y)+' L 1536 '+(m*1536+b-y)+' V 2048 H 0 Z" transform="translate('+(-x)+' 0)"/>':'';
 const size=kind==='hp'?h*1.1:Math.min(150,Math.max(92,h*1.12));
 return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" overflow="hidden"><rect width="100%" height="100%" fill="#fefbeb"/>'+shade+'<text data-card-value="'+kind+'" x="'+w/2+'" y="'+h/2+'" fill="'+color+'" font-size="'+size+'" dominant-baseline="central" text-anchor="middle" textLength="'+Math.min(w-8,String(value).length*size*.5)+'" lengthAdjust="spacingAndGlyphs">'+value+'</text></svg>';
}
function overlay(state,c,alignment='xMidYMid'){
 const l=layouts[c.art],v=values(state,c);
 if(!l)return '';
 return '<svg class="card-values" viewBox="0 0 1536 2048" preserveAspectRatio="'+alignment+' meet" aria-hidden="true" focusable="false">'+field(l.hp,v.hp,'hp',l.edge,c.hp<c.maxHp?'#8c2036':'#000')+(v.total===null?'':field(l.attack,v.attack,'attack',l.edge,v.boosted?'#155241':'#000'))+'</svg>';
}
root.GoghosCardValues=Object.freeze({values,overlay,layoutFor:index=>layouts[index]});
})(globalThis);
