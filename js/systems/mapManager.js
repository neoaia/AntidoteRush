const MAPS = {
  CITY: {
    background: "/assets/maps/city.png",

    obstacles: [
      { x: 250, y: 260, w: 180, h: 120 },
      { x: 520, y: 230, w: 140, h: 90 },
    ],

    zombieZones: [
      { x: 50, y: 400, w: 200, h: 150, rate: 0.01 },
      { x: 900, y: 350, w: 250, h: 200, rate: 0.02 },
    ],

    playerSpawn: { x: 600, y: 350 },
  },
};

let currentMap;
let bgImage;

function loadMap(key) {
  currentMap = MAPS[key];
  bgImage = loadImage(currentMap.background);
  return currentMap;
}

function drawMap() {
  image(bgImage, 0, 0, width, height);
}

function getMap() {
  return currentMap;
}
