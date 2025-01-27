"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PerlinNoise } from "../lib/noise";
import { TopoConfig } from "../lib/topoGenerator";

interface Props {
  config: TopoConfig;
}

function hexToThreeColor(hex: string) {
  return new THREE.Color(hex);
}

function buildTerrain(config: TopoConfig) {
  const GX = config.terrainGridX ?? 120;
  const GY = config.terrainGridY ?? 80;
  const altitude = config.terrainAltitude ?? 1.2;

  const noise = new PerlinNoise(config.seed);
  const hmap = new Float32Array(GX * GY);
  let lo = Infinity, hi = -Infinity;

  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      const v = noise.fbm(
        (gx / GX) * (config.terrain3dScale ?? 3.5),
        (gy / GY) * (config.terrain3dScale ?? 3.5),
        config.terrain3dOctaves ?? 3,
      );
      hmap[gy * GX + gx] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  const span = hi - lo || 1;
  for (let i = 0; i < hmap.length; i++) hmap[i] = (hmap[i] - lo) / span;

  // PlaneGeometry : GX-1 × GY-1 segments, size 10 × 10
  const W = 10, H = 10, maxH = altitude * 3;
  const geo = new THREE.PlaneGeometry(W, H, GX - 1, GY - 1);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    positions.setY(i, hmap[i] * maxH);
  }
  geo.computeVertexNormals();

  return { geo, hmap, GX, GY, W, H, maxH };
}

function buildContourLines(
  hmap: Float32Array,
  GX: number,
  GY: number,
  W: number,
  H: number,
  maxH: number,
  lineCount: number,
  lineColor: string,
  highColor: string,
) {
  const group = new THREE.Group();
  const cLow  = new THREE.Color(lineColor);
  const cHigh = new THREE.Color(highColor);

  for (let level = 1; level < lineCount; level++) {
    const threshold = level / lineCount;
    const points: THREE.Vector3[] = [];

    // Marching squares sur la grille pour extraire les isolignes
    for (let gy = 0; gy < GY - 1; gy++) {
      for (let gx = 0; gx < GX - 1; gx++) {
        const h00 = hmap[gy * GX + gx];
        const h10 = hmap[gy * GX + gx + 1];
        const h01 = hmap[(gy + 1) * GX + gx];
        const h11 = hmap[(gy + 1) * GX + gx + 1];

        const idx =
          (h00 >= threshold ? 8 : 0) |
          (h10 >= threshold ? 4 : 0) |
          (h11 >= threshold ? 2 : 0) |
          (h01 >= threshold ? 1 : 0);

        if (idx === 0 || idx === 15) continue;

        // Interpolation sur chaque arête
        const interp = (a: number, b: number) =>
          b === a ? 0.5 : (threshold - a) / (b - a);

        const edges: [number, number][] = [];

        const tTop    = interp(h00, h10);
        const tRight  = interp(h10, h11);
        const tBot    = interp(h01, h11);
        const tLeft   = interp(h00, h01);

        // positions normalisées [0,1]
        const pTop   : [number, number] = [gx + tTop,       gy];
        const pRight : [number, number] = [gx + 1,          gy + tRight];
        const pBot   : [number, number] = [gx + tBot,       gy + 1];
        const pLeft  : [number, number] = [gx,              gy + tLeft];

        switch (idx) {
          case 1: case 14: edges.push(pLeft, pBot);   break;
          case 2: case 13: edges.push(pBot, pRight);  break;
          case 3: case 12: edges.push(pLeft, pRight); break;
          case 4: case 11: edges.push(pTop, pRight);  break;
          case 5:          edges.push(pTop, pLeft, pBot, pRight); break;
          case 6: case 9:  edges.push(pTop, pBot);    break;
          case 7: case 8:  edges.push(pTop, pLeft);   break;
          case 10:         edges.push(pTop, pRight, pBot, pLeft); break;
        }

        for (let i = 0; i < edges.length; i += 2) {
          const [ax, ay] = edges[i];
          const [bx, by] = edges[i + 1];

          const toWorld = (nx: number, ny: number, h: number): THREE.Vector3 => {
            const wx = (nx / (GX - 1) - 0.5) * W;
            const wz = (ny / (GY - 1) - 0.5) * H;
            return new THREE.Vector3(wx, h * maxH + 0.04, wz);
          };

          const ha = h00 + (h10 - h00) * tTop; // approximation
          points.push(toWorld(ax, ay, threshold));
          points.push(toWorld(bx, by, threshold));
        }
      }
    }

    if (points.length === 0) continue;

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const color = cLow.clone().lerp(cHigh, threshold);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5 + threshold * 0.5,
    });
    const lines = new THREE.LineSegments(geo, mat);
    group.add(lines);
  }

  return group;
}

export default function TopoScene3D({ config }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    animId: number;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // --- Scene setup ---
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(new THREE.Color(config.terrainBgColor ?? "#000000"));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance   = 2;
    controls.maxDistance   = 30;
    controls.maxPolarAngle = Math.PI / 2;

    // --- Terrain mesh (surface solide sombre) ---
    const { geo, hmap, GX, GY, W: TW, H: TH, maxH } = buildTerrain(config);
    const terrainMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(config.terrainBgColor ?? "#000000").addScalar(0.04),
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, terrainMat);
    scene.add(mesh);

    // --- Contour lines ---
    const contours = buildContourLines(
      hmap, GX, GY, TW, TH, maxH,
      config.terrain3dLineCount ?? 17,
      config.terrainLineColor ?? "#00ff66",
      config.terrainHighColor ?? "#afffcf",
    );
    scene.add(contours);

    // --- Grid 3D ---
    if (config.grid3dEnabled) {
      const cells = config.grid3dCells ?? 8;
      const color = new THREE.Color(config.grid3dLineColor ?? "#ffffff");
      const gridHelper = new THREE.GridHelper(TW, cells, color, color);
      (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.2;
      (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
      gridHelper.position.y = -0.05;
      scene.add(gridHelper);

      if (config.grid3dLabels) {
        const cols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const cellSize = TW / cells;
        const originCol = config.grid3dOriginCol ?? 0;
        const originRow = config.grid3dOriginRow ?? 1;
        for (let j = 0; j < cells; j++) {
          for (let i = 0; i < cells; i++) {
            const label = `${cols[(originCol + i) % 26]}${originRow + j}`;
            // Canvas texture pour le label
            const tc = document.createElement("canvas");
            tc.width = 128; tc.height = 128;
            const tc2d = tc.getContext("2d")!;
            tc2d.fillStyle = "rgba(0,0,0,0)";
            tc2d.fillRect(0, 0, 128, 128);
            tc2d.fillStyle = config.grid3dLineColor ?? "#ffffff";
            tc2d.font = "bold 52px monospace";
            tc2d.textAlign = "center";
            tc2d.textBaseline = "middle";
            tc2d.globalAlpha = 0.45;
            tc2d.fillText(label, 64, 64);
            const tex = new THREE.CanvasTexture(tc);
            const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
            const sprite = new THREE.Sprite(mat);
            sprite.position.set(
              (i + 0.5) * cellSize - TW / 2,
              0.1,
              (j + 0.5) * cellSize - TH / 2,
            );
            sprite.scale.set(cellSize * 0.6, cellSize * 0.6, 1);
            scene.add(sprite);
          }
        }
      }
    }

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // --- Resize handler ---
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- Render loop ---
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { renderer, controls, animId };

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      geo.dispose();
      terrainMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [config]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
