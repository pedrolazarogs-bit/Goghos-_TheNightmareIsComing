// User-supplied KitCharacters cards. Printed stats only; no inferred skill/class effects.
(function(root){'use strict';
const cards=[
  {
    "id": "kit-Base77_20261023223319",
    "name": "Unicorn",
    "image": "assets/characters-v047/Original-Base77_20261023223319.png",
    "maxHp": 390,
    "baseAtk": 60,
    "hits": 1,
    "attackName": "Stardust",
    "portrait": "assets/menu-v036/character-0.webp",
    "breath": 6
  },
  {
    "id": "kit-Base68_20261023101502",
    "name": "Sam",
    "image": "assets/characters-v047/Original-Base68_20261023101502.png",
    "maxHp": 530,
    "baseAtk": 70,
    "hits": 6,
    "attackName": "Steel Jaw",
    "portrait": "assets/menu-v036/character-1.webp",
    "breath": 7
  },
  {
    "id": "kit-Base63_20261021225220",
    "name": "Sarck",
    "image": "assets/characters-v047/Original-Base63_20261021225220.png",
    "maxHp": 530,
    "baseAtk": null,
    "hits": 1,
    "attackName": "Steal Jaw",
    "portrait": "assets/menu-v036/character-2.webp",
    "breath": 5
  },
  {
    "id": "kit-Base77_20261023224039",
    "name": "Nully",
    "image": "assets/characters-v047/Original-Base77_20261023224039.png",
    "maxHp": 370,
    "baseAtk": 80,
    "hits": 1,
    "attackName": "Katana",
    "portrait": "assets/menu-v036/character-3.webp",
    "breath": 5
  },
  {
    "id": "kit-Base68_20261023194147",
    "name": "Mike",
    "image": "assets/characters-v047/Original-Base68_20261023194147.png",
    "maxHp": 130,
    "baseAtk": 170,
    "hits": 1,
    "attackName": "AK-47",
    "portrait": "assets/menu-v036/character-4.webp",
    "breath": 6
  },
  {
    "id": "kit-Base63_20261022170442",
    "name": "Jonh",
    "image": "assets/characters-v047/Original-Base63_20261022170442.png",
    "maxHp": 270,
    "baseAtk": 80,
    "hits": 1,
    "attackName": "Sharp Guitar",
    "portrait": null,
    "breath": 3
  },
  {
    "id": "kit-Base65_20261023032340",
    "name": "Zeneerian",
    "image": "assets/characters-v047/Original-Base65_20261023032340.png",
    "maxHp": 1700,
    "baseAtk": 700,
    "hits": 1,
    "attackName": "Presence",
    "portrait": null,
    "breath": 12
  },
  {
    "id": "kit-Base66_20261024011640",
    "name": "Eletric",
    "image": "assets/characters-v047/Original-Base66_20261024011640.png",
    "maxHp": 220,
    "baseAtk": 100,
    "hits": 1,
    "attackName": "3000w",
    "portrait": null,
    "breath": 4
  },
  {
    "id": "kit-Base68_20261023181416",
    "name": "Penxy",
    "image": "assets/characters-v047/Original-Base68_20261023181416.png",
    "maxHp": 500,
    "baseAtk": 140,
    "hits": 1,
    "attackName": "Phantom Claw",
    "portrait": null,
    "breath": 7
  },
  {
    "id": "kit-Base68_20261023182557",
    "name": "Z-Zus",
    "image": "assets/characters-v047/Original-Base68_20261023182557.png",
    "maxHp": 1200,
    "baseAtk": 300,
    "hits": 1,
    "attackName": "Pebble",
    "portrait": null,
    "breath": 5
  },
  {
    "id": "kit-Base68_20261023200328",
    "name": "Chama",
    "image": "assets/characters-v047/Original-Base68_20261023200328.png",
    "maxHp": 230,
    "baseAtk": 55,
    "hits": 6,
    "attackName": "Fire Ball",
    "portrait": null,
    "breath": 7
  },
  {
    "id": "kit-Base68_20261023202010",
    "name": "Daztirry",
    "image": "assets/characters-v047/Original-Base68_20261023202010.png",
    "maxHp": 1250,
    "baseAtk": 240,
    "hits": 1,
    "attackName": "Skewer of fear",
    "portrait": null,
    "breath": 10
  },
  {
    "id": "kit-Base77_20261023204636",
    "name": "Zuri",
    "image": "assets/characters-v047/Original-Base77_20261023204636.png",
    "maxHp": 1050,
    "baseAtk": 160,
    "hits": 1,
    "attackName": "Primordial Sword",
    "portrait": null,
    "breath": 12
  },
  {
    "id": "kit-Base77_20261023222344",
    "name": "Trucc",
    "image": "assets/characters-v047/Original-Base77_20261023222344.png",
    "maxHp": 430,
    "baseAtk": 120,
    "hits": 1,
    "attackName": "Scratch",
    "portrait": null,
    "breath": 4
  },
  {
    "id": "kit-Base77_20261023224851",
    "name": "Rawlin",
    "image": "assets/characters-v047/Original-Base77_20261023224851.png",
    "maxHp": 860,
    "baseAtk": 180,
    "hits": 1,
    "attackName": "Oxtal",
    "portrait": null,
    "breath": 6
  },
  {
    "id": "kit-Base77_20261023225559",
    "name": "Barn",
    "image": "assets/characters-v047/Original-Base77_20261023225559.png",
    "maxHp": 330,
    "baseAtk": 120,
    "hits": 1,
    "attackName": "Hypnosis",
    "portrait": null,
    "breath": 6
  },
  {
    "id": "kit-Base77_20261023230628",
    "name": "Fomor",
    "image": "assets/characters-v047/Original-Base77_20261023230628.png",
    "maxHp": 260,
    "baseAtk": 220,
    "hits": 1,
    "attackName": "Soul",
    "portrait": null,
    "breath": 7
  },
  {
    "id": "kit-Base77_20261023231438",
    "name": "Elish",
    "image": "assets/characters-v047/Original-Base77_20261023231438.png",
    "maxHp": 240,
    "baseAtk": 80,
    "hits": 1,
    "attackName": "Lazer Gun",
    "portrait": null,
    "breath": 3
  },
  {
    "id": "kit-Base77_20261023232441",
    "name": "Sheriff · verde",
    "image": "assets/characters-v047/Original-Base77_20261023232441.png",
    "maxHp": 190,
    "baseAtk": null,
    "hits": 1,
    "attackName": "Magnum",
    "portrait": null,
    "breath": 3
  },
  {
    "id": "kit-Base77_20261023234212",
    "name": "Sheriff · roxo",
    "image": "assets/characters-v047/Original-Base77_20261023234212.png",
    "maxHp": 210,
    "baseAtk": 220,
    "hits": 1,
    "attackName": "Aim",
    "portrait": null,
    "breath": 4
  },
  {
    "id": "kit-Base77_20261023235058",
    "name": "Vaglar · preto",
    "image": "assets/characters-v047/Original-Base77_20261023235058.png",
    "maxHp": 590,
    "baseAtk": null,
    "hits": 1,
    "attackName": "Cursed Book",
    "portrait": null,
    "breath": 12
  },
  {
    "id": "kit-Base77_20261023235926",
    "name": "Vaglar · azul",
    "image": "assets/characters-v047/Original-Base77_20261023235926.png",
    "maxHp": 230,
    "baseAtk": 90,
    "hits": 1,
    "attackName": "Kick",
    "portrait": null,
    "breath": 4
  },
  {
    "id": "kit-Base77_20261024000815",
    "name": "DD-X",
    "image": "assets/characters-v047/Original-Base77_20261024000815.png",
    "maxHp": 260,
    "baseAtk": 45,
    "hits": 2,
    "attackName": "Fish",
    "portrait": null,
    "breath": 6
  },
  {
    "id": "kit-Base77_20261024001601",
    "name": "Rayyb",
    "image": "assets/characters-v047/Original-Base77_20261024001601.png",
    "maxHp": 240,
    "baseAtk": 90,
    "hits": 1,
    "attackName": "Sleeping Pill",
    "portrait": null,
    "breath": 4
  },
  {
    "id": "kit-Base77_20261024002335",
    "name": "Endrik",
    "image": "assets/characters-v047/Original-Base77_20261024002335.png",
    "maxHp": 160,
    "baseAtk": 250,
    "hits": 1,
    "attackName": "Metal Shark",
    "portrait": null,
    "breath": 6
  },
  {
    "id": "kit-Base77_20261024002928",
    "name": "Alex",
    "image": "assets/characters-v047/Original-Base77_20261024002928.png",
    "maxHp": 200,
    "baseAtk": 170,
    "hits": 1,
    "attackName": "ShotGun",
    "portrait": null,
    "breath": 2
  },
  {
    "id": "kit-Base77_20261024003723",
    "name": "P.ULLYS",
    "image": "assets/characters-v047/Original-Base77_20261024003723.png",
    "maxHp": 150,
    "baseAtk": 300,
    "hits": 1,
    "attackName": "Missle",
    "portrait": null,
    "breath": 6
  },
  {
    "id": "kit-Base77_20261024004609",
    "name": "Cavaleiro",
    "image": "assets/characters-v047/Original-Base77_20261024004609.png",
    "maxHp": 920,
    "baseAtk": 130,
    "hits": 1,
    "attackName": "Scalibur",
    "portrait": null,
    "breath": 8
  },
  {
    "id": "kit-Base77_20261024005349",
    "name": "Zikssy",
    "image": "assets/characters-v047/Original-Base77_20261024005349.png",
    "maxHp": 160,
    "baseAtk": 120,
    "hits": 1,
    "attackName": "Bite",
    "portrait": null,
    "breath": 1
  },
  {
    "id": "kit-Base77_20261024005943",
    "name": "Linx",
    "image": "assets/characters-v047/Original-Base77_20261024005943.png",
    "maxHp": 660,
    "baseAtk": null,
    "hits": 1,
    "attackName": "Prototype",
    "portrait": null,
    "breath": 3
  },
  {
    "id": "kit-Base77_20261024010549",
    "name": "Karma",
    "image": "assets/characters-v047/Original-Base77_20261024010549.png",
    "maxHp": 320,
    "baseAtk": 120,
    "hits": 1,
    "attackName": "Lazer Pop",
    "portrait": null,
    "breath": 7
  },
  {
    "id": "kit-Base77_20261024011138",
    "name": "Draktar",
    "image": "assets/characters-v047/Original-Base77_20261024011138.png",
    "maxHp": 310,
    "baseAtk": 90,
    "hits": 2,
    "attackName": "Duble Blade",
    "portrait": null,
    "breath": 6
  }
];
cards.forEach(Object.freeze);Object.freeze(cards);
if(typeof module!=='undefined'&&module.exports)module.exports=cards;else root.GoghosCharacters=cards;
})(globalThis);
