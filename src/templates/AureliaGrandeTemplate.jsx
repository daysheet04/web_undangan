import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mediaUrl } from "../lib/api.js";
const A = "/assets/images/templates/aurelia-grande/",
  M = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ],
  D = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const dateText = (v) => {
  const d = new Date(`${v}T12:00:00`);
  return `${D[d.getDay()]}, ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
};
export default function AureliaGrandeTemplate({
  invitation: i,
  media,
  giftAccounts,
  greetings,
  guestName,
  guestSalutation,
  preview,
}) {
  const bride = i.bride_nickname || "Nisa",
    groom = i.groom_nickname || "Andi",
    cover = mediaUrl(i.cover_image),
    [entered, setEntered] = useState(false),
    [panel, setPanel] = useState(null),
    [near, setNear] = useState(""),
    photos = media.slice(0, Math.max(1, +i.gallery_limit || 5));
  useEffect(() => {
    const closePanel = (event) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", closePanel);
    return () => window.removeEventListener("keydown", closePanel);
  }, []);
  useEffect(() => {
    if (panel && document.pointerLockElement) document.exitPointerLock?.();
  }, [panel]);
  const panels = {
    couple: (
      <Panel title={`${bride} & ${groom}`} eyebrow="Meet the couple">
        <img className="ag-panel-hero" src={cover} />
        <p>Kisah terbaik kami dimulai dari sini.</p>
      </Panel>
    ),
    profile: (
      <Panel title="Mempelai" eyebrow="The bride & groom">
        <div className="ag-profile-grid">
          <Person
            photo={mediaUrl(
              i.bride_photo || media[0]?.file_path || i.cover_image,
            )}
            name={i.bride_full_name}
            parents={`${i.bride_father} & ${i.bride_mother}`}
          />
          <Person
            photo={mediaUrl(
              i.groom_photo || media[1]?.file_path || i.cover_image,
            )}
            name={i.groom_full_name}
            parents={`${i.groom_father} & ${i.groom_mother}`}
          />
        </div>
      </Panel>
    ),
    event: (
      <Panel title="Rangkaian Acara" eyebrow="Save the date">
        <Event
          title="Akad Nikah"
          date={i.akad_date}
          time={i.akad_start_time}
          venue={i.venue_name}
        />
        <Event
          title="Resepsi"
          date={i.reception_date}
          time={i.reception_start_time}
          venue={i.venue_name}
        />
        <p>{i.venue_address}</p>
        <a className="ag-ui-button" href={i.maps_url} target="_blank">
          Buka lokasi
        </a>
      </Panel>
    ),
    story: (
      <Panel title="Kisah Kami" eyebrow="Our journey">
        <p>{i.love_story}</p>
      </Panel>
    ),
    gallery: (
      <Panel title="Galeri Kami" eyebrow="Captured moments">
        <div className="ag-panel-gallery">
          {photos.map((p, n) => (
            <img key={p.id || n} src={mediaUrl(p.file_path)} />
          ))}
        </div>
      </Panel>
    ),
    gift: (
      <Panel title="Tanda Kasih" eyebrow="Wedding gift">
        <p>Doa restu Anda adalah hadiah terindah.</p>
        {giftAccounts.map((a, n) => (
          <div className="ag-account" key={a.id || n}>
            <small>{a.provider}</small>
            <strong>{a.account_number}</strong>
            <span>a.n. {a.account_name}</span>
          </div>
        ))}
      </Panel>
    ),
    rsvp: (
      <Panel title="Konfirmasi Kehadiran" eyebrow="R.S.V.P.">
        <form
          data-greeting-form
          data-invitation-id={i.id || ""}
          data-preview={preview ? "true" : "false"}
        >
          <input name="guest_name" defaultValue={guestName} />
          <select name="attendance" defaultValue="attending">
            <option value="attending">Hadir</option>
            <option value="not_attending">Tidak hadir</option>
            <option value="unsure">Masih ragu</option>
          </select>
          <textarea name="message" placeholder="Doa dan ucapan" />
          <button className="ag-ui-button">Kirim</button>
          <p data-form-message />
        </form>
        <div className="ag-mini-wishes">
          {greetings.slice(0, 3).map((g) => (
            <p key={g.id}>
              <b>{g.guest_name}</b> — {g.message}
            </p>
          ))}
        </div>
      </Panel>
    ),
  };
  return (
    <div
      className={`invitation-page aurelia-grande ${entered ? "ag-entered" : ""}`}
      data-template-root
    >
      <BallroomWorld
        active={entered && !panel}
        onInteract={setPanel}
        onNear={setNear}
        bridePhoto={mediaUrl(
          i.bride_photo || media[0]?.file_path || i.cover_image,
        )}
        groomPhoto={mediaUrl(
          i.groom_photo || media[1]?.file_path || i.cover_image,
        )}
        coverPhoto={cover}
        coupleNames={`${bride} & ${groom}`}
        galleryPhotos={photos.map((photo) => mediaUrl(photo.file_path))}
      />
      {!entered && (
        <section className="ag-game-cover">
          <img src={cover} />
          <div className="ag-cover-vignette" />
          <div className="ag-cover-card">
            <span>DAYMOMENT MEMPERSEMBAHKAN</span>
            <em
              style={{
                display: "block",
                marginTop: 9,
                color: "#fff",
                font: "600 .48rem var(--ag-sans)",
                fontStyle: "normal",
                letterSpacing: ".18em",
              }}
            >
              AN INTERACTIVE 3D WEDDING EXPERIENCE
            </em>
            <small>The Wedding Celebration of</small>
            <h1>
              {bride}
              <i>&amp;</i>
              {groom}
            </h1>
            <time>{dateText(i.reception_date)}</time>
            <div>
              <small>{guestSalutation}</small>
              <strong>{guestName}</strong>
            </div>
            <button onClick={() => { setEntered(true); setPanel("help"); }}>
              Masuk ke Ballroom <b>→</b>
            </button>
          </div>
        </section>
      )}
      {entered && (
        <>
          <header className="ag-hud">
            <div>
              <small>THE WEDDING OF</small>
              <strong>
                {bride} &amp; {groom}
              </strong>
            </div>
            <button onClick={() => setPanel("help")}>?</button>
          </header>
          <div className="ag-crosshair">
            <i />
            <i />
          </div>
          <div className={`ag-interact-prompt ${near ? "show" : ""}`}>
            <kbd>E</kbd>
            <span>{near || "Dekati objek"}</span>
          </div>
          <div className="ag-controls-hint">
            <span>W</span> maju · <span>S</span> mundur · <span>A</span> kiri ·{" "}
            <span>D</span> kanan · <span>MOUSE</span> melihat · <span>E</span> membuka
          </div>
          <MobileControls />
        </>
      )}
      {panel && (
        <div className="ag-overlay">
          <button className="ag-panel-close" onClick={() => setPanel(null)}>
            ×
          </button>
          {panel === "help" ? (
            <Panel title="Cara Menjelajah" eyebrow="Welcome">
              <div className="ag-key-guide">
                <div><kbd>W</kbd><span>Maju</span></div>
                <div><kbd>S</kbd><span>Mundur</span></div>
                <div><kbd>A</kbd><span>Berjalan ke kiri</span></div>
                <div><kbd>D</kbd><span>Berjalan ke kanan</span></div>
                <div><kbd>Mouse</kbd><span>Melihat sekeliling</span></div>
                <div><kbd>E</kbd><span>Membuka titik interaksi</span></div>
              </div>
              <p className="ag-help-note">
                Mobile: tahan tombol arah untuk berjalan dan geser area kosong
                pada layar untuk melihat sekeliling. Dekati papan bercahaya,
                arahkan crosshair, lalu tekan E.
              </p>
            </Panel>
          ) : (
            panels[panel]
          )}
          <div className="ag-close-hint"><kbd>Esc</kbd> atau klik <b>×</b> untuk menutup</div>
        </div>
      )}
      {i.has_music && i.music_file && (
        <audio data-wedding-audio loop src={mediaUrl(i.music_file)} />
      )}{" "}
      {entered && i.has_music && (
        <button className="ag-music" data-music-controller>
          ♫
        </button>
      )}
    </div>
  );
}
function BallroomWorld({
  active,
  onInteract,
  onNear,
  bridePhoto,
  groomPhoto,
  coverPhoto,
  coupleNames,
  galleryPhotos,
}) {
  const mount = useRef(null),
    ar = useRef(active),
    ir = useRef(onInteract),
    nr = useRef(onNear);
  useEffect(() => {
    ar.current = active;
  }, [active]);
  useEffect(() => {
    ir.current = onInteract;
    nr.current = onNear;
  }, [onInteract, onNear]);
  useEffect(() => {
    const host = mount.current,
      scene = new THREE.Scene(),
      mobileDevice = window.matchMedia("(pointer: coarse)").matches,
      lowEndMobile =
        mobileDevice &&
        ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
          (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
    scene.background = new THREE.Color(0x170f0b);
    scene.fog = new THREE.FogExp2(0x2a1910, 0.018);
    const camera = new THREE.PerspectiveCamera(
      68,
      host.clientWidth / host.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 1.72, 12);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
    });
    renderer.setPixelRatio(
      mobileDevice ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 1.7),
    );
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.style.touchAction = "none";
    renderer.shadowMap.enabled = !mobileDevice;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.append(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffefd2, 0x24120a, 2.2));
    const key = new THREE.DirectionalLight(0xffdfae, 2.8);
    key.position.set(5, 12, 6);
    key.castShadow = true;
    scene.add(key);
    (mobileDevice ? [0] : [-12, 0, 12]).forEach((x) => {
      const p = new THREE.PointLight(0xffc777, 22, 18, 2);
      p.position.set(x, 6, -10);
      scene.add(p);
    });
    const gold = new THREE.MeshStandardMaterial({
        color: 0xb58a4f,
        metalness: 0.75,
        roughness: 0.24,
      }),
      ivory = new THREE.MeshStandardMaterial({
        color: 0xeee2ce,
        roughness: 0.5,
      }),
      dark = new THREE.MeshStandardMaterial({
        color: 0x311b11,
        roughness: 0.7,
      }),
      velvet = new THREE.MeshStandardMaterial({
        color: 0x5c241b,
        roughness: 0.82,
      }),
      marble = new THREE.MeshStandardMaterial({
        color: 0xdac8ad,
        metalness: 0.08,
        roughness: 0.23,
      }),
      blush = new THREE.MeshStandardMaterial({ color: 0xb77b72, roughness: 0.68 }),
      sage = new THREE.MeshStandardMaterial({ color: 0x61705a, roughness: 0.82 }),
      cream = new THREE.MeshStandardMaterial({ color: 0xfff7e8, roughness: 0.86 }),
      champagne = new THREE.MeshStandardMaterial({ color: 0xe8c8aa, roughness: 0.82 }),
      dustyRose = new THREE.MeshStandardMaterial({ color: 0xd59a9b, roughness: 0.84 }),
      leafDark = new THREE.MeshStandardMaterial({ color: 0x344f3c, roughness: 0.9 }),
      wallTaupe = new THREE.MeshStandardMaterial({ color: 0x745d4b, roughness: 0.88 }),
      glow = new THREE.MeshStandardMaterial({ color: 0xffd18a, emissive: 0x9a5522, emissiveIntensity: 1.6 });
    const box = (pos, size, mat = ivory) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
        m.position.set(...pos);
        m.castShadow = m.receiveShadow = true;
        scene.add(m);
        return m;
      },
      cyl = (pos, r, h, mat = ivory) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat);
        m.position.set(...pos);
        m.castShadow = m.receiveShadow = true;
        scene.add(m);
        return m;
      },
      sphere = (pos, r, mat = ivory) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), mat);
        m.position.set(...pos);
        m.castShadow = true;
        scene.add(m);
        return m;
      },
      torus = (pos, radius, tube, mat = gold) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 48), mat);
        m.position.set(...pos);
        scene.add(m);
        return m;
      };
    box([0, -0.15, 0], [34, 0.3, 48], marble);
    // Coffered ballroom ceiling keeps the upper view intentional: ivory
    // panels, champagne beams, gold medallions and warm recessed bulbs.
    box([0, 12.15, 0], [34, 0.3, 48], ivory);
    const ceilingColumns = mobileDevice ? [-10.8, 0, 10.8] : [-13.5, -6.75, 0, 6.75, 13.5];
    const ceilingRows = mobileDevice ? [-15, 0, 15] : [-20, -12, -4, 4, 12, 20];
    ceilingColumns.forEach((x) => box([x, 11.88, 0], [0.3, 0.38, 47], champagne));
    ceilingRows.forEach((z) => box([0, 11.88, z], [33, 0.38, 0.3], champagne));
    for (const x of mobileDevice ? [-8, 8] : [-12, -6, 0, 6, 12]) {
      for (const z of mobileDevice ? [-10, 10] : [-16, -8, 0, 8, 16]) {
        const ceilingLamp = sphere([x, 11.62, z], 0.1, glow);
        ceilingLamp.scale.y = 0.42;
      }
    }
    for (const z of mobileDevice ? [-4] : [-12, -2, 8]) {
      const medallionOuter = torus([0, 11.69, z], 1.72, 0.12, gold);
      medallionOuter.rotation.x = Math.PI / 2;
      const medallionInner = torus([0, 11.67, z], 1.25, 0.055, champagne);
      medallionInner.rotation.x = Math.PI / 2;
    }
    box([0, 7, -24], [34, 14, 0.5], ivory);
    box([-17, 6, 0], [0.5, 12, 48], dark);
    box([17, 6, 0], [0.5, 12, 48], dark);
    // Lightweight classical wall treatment: framed taupe panels, chair rail,
    // cornice and warm sconces break up the long plain side walls.
    for (const side of [-1, 1]) {
      const wallX = side * 16.72;
      box([wallX, 10.85, 0], [0.14, 0.28, 47], gold);
      box([wallX, 2.25, 0], [0.14, 0.2, 47], gold);
      const wallPanels = mobileDevice ? [-13, 0, 13] : [-16, -8, 0, 8, 16];
      wallPanels.forEach((z, index) => {
        box([wallX, 6.35, z], [0.1, 6.65, 5.75], wallTaupe);
        box([wallX - side * 0.07, 6.35, z - 2.72], [0.1, 6.3, 0.11], gold);
        box([wallX - side * 0.07, 6.35, z + 2.72], [0.1, 6.3, 0.11], gold);
        box([wallX - side * 0.07, 3.22, z], [0.1, 0.11, 5.55], gold);
        box([wallX - side * 0.07, 9.48, z], [0.1, 0.11, 5.55], gold);
        if (!mobileDevice || index === 1) {
          cyl([wallX - side * 0.2, 6.4, z], 0.055, 1.15, gold);
          sphere([wallX - side * 0.32, 7.08, z], 0.17, glow);
        }
      });
    }
    // Fully modelled stage wall keeps the visual language consistent and
    // avoids mixing a generated ballroom image with real-time geometry.
    box([0, 6.5, -23.65], [12.5, 12, 0.45], dark);
    // Classical side panels fill the large blank backdrop while preserving a
    // calm focal area around the couple.
    for (const side of [-1, 1]) {
      const panelX = side * 10.35;
      box([panelX, 6.15, -23.38], [5.25, 9.6, 0.16], champagne);
      box([panelX, 6.15, -23.24], [4.62, 8.95, 0.12], ivory);
      box([panelX, 3.05, -23.12], [3.65, 2.15, 0.08], sage);
      box([panelX, 7.4, -23.12], [3.65, 4.65, 0.08], dark);
      const panelArch = torus([panelX, 8.05, -23.02], 1.82, 0.09, gold);
      panelArch.scale.y = 1.45;
      box([panelX - 1.82, 5.35, -23.02], [0.16, 5.4, 0.14], gold);
      box([panelX + 1.82, 5.35, -23.02], [0.16, 5.4, 0.14], gold);
      box([panelX, 2.7, -23.02], [3.8, 0.16, 0.14], gold);
      const sconceStem = box([panelX, 6.25, -22.84], [0.1, 1.2, 0.1], gold);
      sconceStem.rotation.z = side * 0.08;
      sphere([panelX, 6.92, -22.77], 0.19, glow);
      if (!mobileDevice) {
        const sconceLight = new THREE.PointLight(0xffd39a, 6, 5.5, 2);
        sconceLight.position.set(panelX, 6.9, -21.8);
        scene.add(sconceLight);
      }
    }
    const stageArch = torus([0, 6.15, -23.25], 4.65, 0.22, gold);
    stageArch.scale.y = 1.32;
    const innerArch = torus([0, 6.15, -23.15], 4.1, 0.07, ivory);
    innerArch.scale.y = 1.32;
    // Soft fabric swags give the stage the layered wedding-canopy silhouette
    // from the reference, instead of a hard architectural wall.
    const stageSwag = (fromX, toX, topY, drop, mat) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(fromX, topY, -22.86),
        new THREE.Vector3((fromX + toX) / 2, topY - drop, -22.72),
        new THREE.Vector3(toX, topY, -22.86),
      ]);
      const cloth = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.13, 8, false), mat);
      cloth.castShadow = true;
      scene.add(cloth);
    };
    stageSwag(-7.6, 0, 10.8, 2.05, cream);
    stageSwag(0, 7.6, 10.8, 2.05, cream);
    stageSwag(-6.9, 0, 10.25, 1.45, champagne);
    stageSwag(0, 6.9, 10.25, 1.45, champagne);
    for (const side of [-1, 1]) {
      const outer = side * 9.35;
      const inner = side * 4.65;
      const tieX = side * 5.55;
      const curtainShape = new THREE.Shape();
      curtainShape.moveTo(outer, 11.25);
      curtainShape.lineTo(inner, 11.25);
      curtainShape.quadraticCurveTo(side * 4.9, 8.1, tieX, 6.35);
      curtainShape.quadraticCurveTo(side * 4.85, 3.6, inner, 0.9);
      curtainShape.lineTo(outer, 0.9);
      curtainShape.lineTo(outer, 11.25);
      const curtainPanel = new THREE.Mesh(
        new THREE.ShapeGeometry(curtainShape, 20),
        new THREE.MeshStandardMaterial({
          color: 0xe7d6bd,
          roughness: 0.88,
          side: THREE.DoubleSide,
        }),
      );
      curtainPanel.position.z = -22.96;
      curtainPanel.castShadow = true;
      scene.add(curtainPanel);
      for (let fold = 0; fold < 7; fold += 1) {
        const startX = THREE.MathUtils.lerp(outer, inner, (fold + 0.5) / 7);
        const endX = THREE.MathUtils.lerp(outer, inner, (fold + 0.35) / 7);
        const foldCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(startX, 11.15, -22.78),
          new THREE.Vector3(THREE.MathUtils.lerp(startX, tieX, 0.72), 7.75, -22.68),
          new THREE.Vector3(tieX, 6.35, -22.6),
          new THREE.Vector3(endX, 0.95, -22.74),
        ]);
        const foldMesh = new THREE.Mesh(
          new THREE.TubeGeometry(foldCurve, 34, 0.055, 7, false),
          fold % 2 ? cream : champagne,
        );
        scene.add(foldMesh);
      }
      const tieBack = torus([tieX, 6.35, -22.5], 0.34, 0.09, gold);
      tieBack.scale.set(1, 0.55, 1);
      box([side * 7.2, 10.9, -22.8], [5.5, 0.42, 0.65], gold).rotation.z = side * -0.08;
    }
    const flutedColumnGeometry = (() => {
      const positions = [],
        indices = [],
        segments = 32;
      for (let n = 0; n <= segments; n += 1) {
        const angle = (n / segments) * Math.PI * 2;
        const radius = n % 2 ? 0.56 : 0.5;
        positions.push(
          Math.cos(angle) * radius,
          -2.7,
          Math.sin(angle) * radius,
          Math.cos(angle) * radius,
          2.7,
          Math.sin(angle) * radius,
        );
        if (n < segments) {
          const at = n * 2;
          indices.push(at, at + 1, at + 3, at, at + 3, at + 2);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    })();
    const columnLanternRoof = new THREE.ConeGeometry(0.42, 0.28, 8);
    for (const side of [-1, 1])
      for (let z = -19; z <= 15; z += mobileDevice ? 12 : 8) {
        const x = side * 14.8;
        cyl([x, 0.13, z], 0.88, 0.26, marble);
        cyl([x, 0.34, z], 0.72, 0.18, gold);
        cyl([x, 0.52, z], 0.64, 0.2, ivory);
        const shaft = new THREE.Mesh(flutedColumnGeometry, ivory);
        shaft.position.set(x, 3.25, z);
        shaft.castShadow = shaft.receiveShadow = true;
        scene.add(shaft);
        cyl([x, 5.98, z], 0.64, 0.18, gold);
        cyl([x, 6.18, z], 0.76, 0.24, ivory);
        cyl([x, 6.38, z], 0.9, 0.18, gold);
        box([x, 6.52, z], [1.85, 0.16, 1.85], marble);
        cyl([x, 6.72, z], 0.46, 0.18, gold);
        cyl([x, 7.02, z], 0.055, 0.5, gold);
        sphere([x, 7.28, z], 0.23, glow);
        const lanternRoof = new THREE.Mesh(columnLanternRoof, gold);
        lanternRoof.position.set(x, 7.55, z);
        scene.add(lanternRoof);
        for (let bloom = 0; bloom < 6; bloom += 1) {
          const angle = (bloom / 6) * Math.PI * 2;
          const bx = x + Math.cos(angle) * 0.48;
          const bz = z + Math.sin(angle) * 0.48;
          sphere([bx, 6.78 + (bloom % 2) * 0.08, bz], 0.15, bloom % 3 ? cream : dustyRose);
          if (bloom % 2 === 0) {
            const leaf = sphere([x + Math.cos(angle) * 0.62, 6.72, z + Math.sin(angle) * 0.62], 0.13, leafDark);
            leaf.scale.set(1.6, 0.45, 0.75);
            leaf.rotation.y = -angle;
          }
        }
      }
    for (let s = 0; s < 4; s++)
      box(
        [0, 0.18 + s * 0.24, -19 + s * 0.65],
        [14 - s * 0.7, 0.35, 2.1],
        s % 2 ? marble : ivory,
      );
    box([0, 1.05, -21], [13, 1.2, 5], marble);
    const makeLabel = (title, subtitle = "TEKAN E") => {
        const canvas = document.createElement("canvas");
        canvas.width = 768;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(28, 15, 8, .9)";
        ctx.strokeStyle = "rgba(226, 185, 116, .9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(8, 8, 752, 164, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff8ea";
        ctx.font = "600 48px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(title, 384, 79);
        ctx.fillStyle = "#dcb77b";
        ctx.font = "700 24px Arial";
        ctx.fillText(subtitle, 384, 128);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
        );
        sprite.scale.set(3.45, 0.82, 1);
        return sprite;
      },
      hotspots = [],
      marker = (id, title, label, pos) => {
        const g = new THREE.Group();
        g.position.set(...pos);
        const r = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.035, 12, 48),
          new THREE.MeshBasicMaterial({ color: 0xd7aa67 }),
        );
        r.rotation.x = Math.PI / 2;
        g.add(
          r,
          new THREE.Mesh(
            new THREE.SphereGeometry(0.12),
            new THREE.MeshBasicMaterial({ color: 0xffd696 }),
          ),
        );
        const sign = makeLabel(title);
        sign.position.y = 1.25;
        g.add(sign);
        g.userData = { id, label };
        scene.add(g);
        hotspots.push(g);
      };
    marker("profile", "PROFIL MEMPELAI", "Lihat profil mempelai", [-12, 1.1, -5]);
    marker("event", "JADWAL ACARA", "Lihat jadwal acara", [12, 1.1, -5]);
    marker("story", "KISAH KAMI", "Baca kisah kami", [-12, 1.1, 8]);
    marker("gallery", "GALERI FOTO", "Buka galeri", [12, 1.1, 8]);
    marker("gift", "WEDDING GIFT", "Buka wedding gift", [-7, 1.1, 15]);
    marker("rsvp", "RSVP & UCAPAN", "Konfirmasi kehadiran", [7, 1.1, 15]);

    // Each information point is a distinct wedding installation, not just a
    // generic table with a sign. The silhouettes make every destination easy
    // to recognise while the guest walks through the ballroom.
    const leafGeometry = new THREE.SphereGeometry(0.22, 10, 7);
    const petalGeometry = new THREE.SphereGeometry(0.18, 12, 8);
    const mobileBloomGeometry = new THREE.IcosahedronGeometry(1, 1);
    const flowerCluster = (x, z, tint = dustyRose, y = 0.22, scale = 1) => {
      const arrangement = new THREE.Group();
      if (mobileDevice) {
        [[-0.52,0.34,-0.02,.95,-.65],[.52,.32,-.03,.92,.65],[0,.2,-.09,.78,1.5]].forEach(
          ([px, py, pz, sx, rot]) => {
            const foliage = new THREE.Mesh(leafGeometry, leafDark);
            foliage.position.set(px, py, pz);
            foliage.scale.set(sx, sx * 0.34, sx * 0.65);
            foliage.rotation.set(0.2, rot, rot * 0.3);
            arrangement.add(foliage);
          },
        );
        [[-.38,.55,.1,.31,tint],[.02,.72,.16,.39,cream],[.42,.52,.1,.3,tint],[0,.35,.2,.24,champagne]].forEach(
          ([px, py, pz, size, mat]) => {
            const bloom = new THREE.Mesh(
              mobileBloomGeometry,
              mat,
            );
            bloom.position.set(px, py, pz);
            bloom.scale.set(size, size * 0.82, size);
            arrangement.add(bloom);
          },
        );
        arrangement.position.set(x, y, z);
        arrangement.scale.setScalar(scale);
        scene.add(arrangement);
        return arrangement;
      }
      const leaf = (px, py, pz, sx, rot, mat = leafDark) => {
        const m = new THREE.Mesh(leafGeometry, mat);
        m.position.set(px, py, pz);
        m.scale.set(sx, sx * 0.34, sx * 0.7);
        m.rotation.set(0.25, rot, rot * 0.35);
        m.castShadow = true;
        arrangement.add(m);
      };
      const bloom = (px, py, pz, size, mat) => {
        const flower = new THREE.Group();
        for (let ring = 0; ring < 2; ring += 1) {
          const count = ring ? 7 : 5;
          for (let n = 0; n < count; n += 1) {
            const angle = (n / count) * Math.PI * 2 + ring * 0.35;
            const petal = new THREE.Mesh(petalGeometry, mat);
            const radius = size * (ring ? 0.34 : 0.16);
            petal.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, ring ? 0 : 0.08);
            petal.scale.set(size * (ring ? 1.25 : 0.9), size * 0.72, size * 0.32);
            petal.rotation.z = angle;
            petal.castShadow = true;
            flower.add(petal);
          }
        }
        const centre = new THREE.Mesh(new THREE.SphereGeometry(size * 0.13, 10, 7), champagne);
        centre.position.z = 0.16;
        flower.add(centre);
        flower.position.set(px, py, pz);
        arrangement.add(flower);
      };
      [[-0.72,0.34,-0.05,1.15,-0.8],[-0.5,0.7,0.03,.95,-.35],[-.9,.9,.08,.78,-1.2],
        [.68,.3,-.03,1.12,.8],[.48,.74,.03,.95,.32],[.9,.92,.08,.76,1.25],
        [-.18,.12,-.12,.88,-1.55],[.2,.14,-.1,.9,1.5]].forEach(v => leaf(...v));
      bloom(-0.48, 0.58, 0.12, 0.92, tint);
      bloom(0.02, 0.78, 0.2, 1.08, cream);
      bloom(0.5, 0.54, 0.14, 0.84, tint === cream ? dustyRose : cream);
      bloom(-0.06, 0.35, 0.24, 0.68, champagne);
      arrangement.position.set(x, y, z);
      arrangement.scale.setScalar(scale);
      scene.add(arrangement);
      return arrangement;
    };
    for (const side of [-1, 1]) {
      const archFlowerCount = lowEndMobile ? 3 : mobileDevice ? 5 : 8;
      for (let n = 0; n < archFlowerCount; n += 1) {
        const angle = Math.PI * (0.18 + n * (0.595 / Math.max(1, archFlowerCount - 1)));
        const x = side * Math.cos(angle) * 4.75;
        const y = 6.15 + Math.sin(angle) * 6.15;
        flowerCluster(x, -22.84, n % 2 ? cream : dustyRose, y - 0.72, 0.55 + (n % 3) * 0.08);
      }
      const tieBouquet = flowerCluster(side * 5.55, -22.42, cream, 5.65, 1.18);
      tieBouquet.rotation.z = side * -0.2;
      const topBouquet = flowerCluster(side * 7.35, -22.66, dustyRose, 9.75, 1.08);
      topBouquet.rotation.z = side * 0.18;
      const panelTop = flowerCluster(side * 10.35, -22.72, cream, 9.45, 0.92);
      panelTop.rotation.z = side * -0.12;
      const panelBase = flowerCluster(side * 10.35, -22.68, dustyRose, 2.35, 1.2);
      panelBase.rotation.z = side * 0.1;
      for (let leaf = 0; leaf < 6; leaf += 1) {
        const vineLeaf = new THREE.Mesh(leafGeometry, leafDark);
        vineLeaf.position.set(
          side * (8.75 + leaf * 0.34),
          8.7 + Math.sin(leaf * 0.8) * 0.42,
          -22.76,
        );
        vineLeaf.scale.set(0.75, 0.24, 0.52);
        vineLeaf.rotation.z = side * (0.35 + leaf * 0.08);
        scene.add(vineLeaf);
      }
    }
    [-5.2, -4.05, -2.85, 2.85, 4.05, 5.2].forEach((x, n) =>
      flowerCluster(x, -17.75, n % 3 === 0 ? dustyRose : cream, 0.18, 0.92 + (n % 2) * 0.14),
    );

    // Profile gallery: double portrait frames below a monumental gold arch.
    torus([-12, 3.05, -5.45], 2.3, 0.11, gold);
    box([-12, 1.35, -5.55], [5.4, 0.28, 1.8], marble);
    const portraitLoader = new THREE.TextureLoader();
    [
      [-13.15, bridePhoto],
      [-10.85, groomPhoto],
    ].forEach(([x, photo]) => {
      box([x, 2.7, -5.35], [1.75, 2.7, 0.18], gold);
      box([x, 2.7, -5.22], [1.52, 2.44, 0.1], dark);
      const texture = portraitLoader.load(photo);
      texture.colorSpace = THREE.SRGBColorSpace;
      const portrait = new THREE.Mesh(
        new THREE.PlaneGeometry(1.44, 2.34),
        new THREE.MeshBasicMaterial({
          map: texture,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
      );
      portrait.position.set(x, 2.7, -5.15);
      scene.add(portrait);
    });
    flowerCluster(-14.1, -4.65); flowerCluster(-9.9, -4.65, ivory);

    // Event pavilion: canopy, hanging clock and glowing calendar plinth.
    [-13.8, -10.2].forEach((x) => cyl([x + 24, 2.1, -5.5], 0.16, 4.2, gold));
    box([12, 4.15, -5.5], [4.4, 0.18, 2.4], ivory);
    torus([12, 2.85, -5.05], 1.05, 0.09, gold);
    const clockFace = cyl([12, 2.85, -5.02], 0.89, 0.1, ivory);
    clockFace.rotation.x = Math.PI / 2;
    box([12, 2.85, -4.93], [0.05, 0.72, 0.04], dark).rotation.z = -0.55;
    box([12.22, 3.08, -4.92], [0.05, 0.48, 0.04], dark).rotation.z = 0.8;
    box([12, 0.55, -4.85], [2.5, 0.9, 0.7], glow);

    // Entrance welcome corner: a traditional floral congratulation board with
    // a separate framed cover portrait displayed beside it.
    const welcomeCanvas = document.createElement("canvas");
    welcomeCanvas.width = 1024;
    welcomeCanvas.height = 560;
    const welcomeCtx = welcomeCanvas.getContext("2d");
    welcomeCtx.fillStyle = "#284132";
    welcomeCtx.fillRect(0, 0, 1024, 560);
    welcomeCtx.strokeStyle = "#d5ae69";
    welcomeCtx.lineWidth = 18;
    welcomeCtx.strokeRect(22, 22, 980, 516);
    welcomeCtx.fillStyle = "#f4e2ba";
    welcomeCtx.textAlign = "center";
    welcomeCtx.font = "700 25px Arial";
    welcomeCtx.letterSpacing = "9px";
    welcomeCtx.fillText("DAYMOMENT MEMPERSEMBAHKAN", 512, 86);
    welcomeCtx.font = "italic 76px Georgia";
    welcomeCtx.letterSpacing = "0px";
    welcomeCtx.fillText("Happy Wedding", 512, 195);
    welcomeCtx.font = "600 66px Georgia";
    welcomeCtx.fillText(coupleNames, 512, 300);
    welcomeCtx.font = "700 28px Arial";
    welcomeCtx.letterSpacing = "8px";
    welcomeCtx.fillText("FOREVER BEGINS TODAY", 512, 405);
    const welcomeTexture = new THREE.CanvasTexture(welcomeCanvas);
    welcomeTexture.colorSpace = THREE.SRGBColorSpace;
    box([-2.2, 2.35, 19.15], [5.0, 2.85, 0.28], gold);
    const welcomeBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(4.65, 2.5),
      new THREE.MeshBasicMaterial({ map: welcomeTexture, side: THREE.DoubleSide }),
    );
    welcomeBoard.position.set(-2.2, 2.35, 18.97);
    welcomeBoard.rotation.y = Math.PI;
    scene.add(welcomeBoard);
    [-4.45, 0.05].forEach((x, index) =>
      flowerCluster(x, 18.9, index ? cream : dustyRose, 1.35, 0.92),
    );
    flowerCluster(-2.2, 18.92, cream, 3.42, 0.82);
    cyl([-3.95, 0.72, 19.15], 0.09, 1.45, gold);
    cyl([-0.45, 0.72, 19.15], 0.09, 1.45, gold);

    const welcomeCoverTexture = new THREE.TextureLoader().load(coverPhoto);
    welcomeCoverTexture.colorSpace = THREE.SRGBColorSpace;
    box([1.95, 2.35, 19.1], [2.55, 3.5, 0.24], gold);
    box([1.95, 2.35, 18.94], [2.28, 3.22, 0.1], dark);
    const welcomePortrait = new THREE.Mesh(
      new THREE.PlaneGeometry(2.12, 3.04),
      new THREE.MeshBasicMaterial({
        map: welcomeCoverTexture,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    welcomePortrait.position.set(1.95, 2.35, 18.87);
    welcomePortrait.rotation.y = Math.PI;
    scene.add(welcomePortrait);
    cyl([1.22, 0.6, 19.1], 0.065, 1.2, gold);
    cyl([2.68, 0.6, 19.1], 0.065, 1.2, gold);
    flowerCluster(1.95, 18.9, dustyRose, 3.72, 0.62);

    // Story garden: open book altar, heart sculpture and floral crescent.
    box([-12, 0.62, 8], [3.8, 1.0, 1.6], dark);
    const pageL = box([-12.78, 1.35, 7.9], [1.65, 0.12, 1.35], ivory); pageL.rotation.z = -0.13;
    const pageR = box([-11.22, 1.35, 7.9], [1.65, 0.12, 1.35], ivory); pageR.rotation.z = 0.13;
    torus([-12.42, 2.8, 7.95], 0.72, 0.12, blush); torus([-11.58, 2.8, 7.95], 0.72, 0.12, blush);
    flowerCluster(-14, 8.2); flowerCluster(-10, 8.2, ivory);

    // Gallery: a stepped wall of illuminated frames in different proportions.
    box([12, 2.25, 8.65], [6.1, 4.8, 0.35], dark);
    const galleryLoader = new THREE.TextureLoader();
    [[10.15,2.75,1.35,2.1,blush],[12,3.05,1.45,2.65,sage],[13.85,2.65,1.35,1.9,ivory]].forEach(([x,y,w,h,mat], index) => {
      box([x, y, 8.38], [w + 0.24, h + 0.24, 0.16], gold);
      const uploadedPhoto = galleryPhotos?.[index];
      if (uploadedPhoto) {
        const texture = galleryLoader.load(uploadedPhoto);
        texture.colorSpace = THREE.SRGBColorSpace;
        const photo = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
            side: THREE.DoubleSide,
          }),
        );
        photo.position.set(x, y, 8.25);
        scene.add(photo);
      } else {
        box([x, y, 8.26], [w, h, 0.1], mat);
      }
    });
    if (!mobileDevice)
      [10.15, 12, 13.85].forEach((x) => {
        const light = new THREE.PointLight(0xffd59a, 5, 4);
        light.position.set(x, 4.65, 7.5);
        scene.add(light);
      });

    // Gift lounge: central treasure chest and wrapped presents with gold bows.
    box([-7, 0.7, 15.2], [3.4, 1.35, 1.7], dark);
    const lid = cyl([-7, 1.42, 15.2], 0.86, 3.4, gold); lid.rotation.z = Math.PI / 2;
    [[-9,.55,14.7,.95,blush],[-5.2,.7,15.35,1.2,sage],[-8.65,.45,16,.75,ivory]].forEach(([x,y,z,s,mat])=>{
      box([x,y,z],[s,s,s],mat);box([x,y+.01,z],[.12,s+.05,s+.05],gold);box([x,y+.01,z],[s+.05,s+.05,.12],gold);
    });

    // RSVP reception: concierge desk, guest book, envelope box and candles.
    box([7, 0.78, 15.2], [4.5, 1.45, 1.5], ivory);
    box([7, 1.55, 15.2], [4.9, 0.14, 1.8], gold);
    const guestBook = box([6.2, 1.72, 14.95], [1.35, 0.08, 0.9], blush); guestBook.rotation.y = -0.18;
    box([8.05, 2.15, 15.15], [1.35, 1.1, 0.18], gold);
    box([8.05, 2.15, 15.03], [1.12, 0.86, 0.12], ivory);
    [-1,1].forEach(side=>{cyl([7 + side*2.45,1.15,15.2],.08,1.9,gold);sphere([7 + side*2.45,2.13,15.2],.14,glow)});
    // AI-rendered couple presented as a living stage character. The transparent
    // cutout belongs to the 3D world through lighting, grounding and motion.
    const coupleTexture = new THREE.TextureLoader().load(`${A}wedding-couple-3d.webp`);
    coupleTexture.colorSpace = THREE.SRGBColorSpace;
    const couple = new THREE.Group();
    const character = new THREE.Mesh(
      new THREE.PlaneGeometry(4.35, 6.5),
      new THREE.MeshBasicMaterial({ map: coupleTexture, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }),
    );
    character.position.y = 3.28;
    couple.add(character);
    const aura = new THREE.Mesh(
      new THREE.CircleGeometry(2.25, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd28b, transparent: true, opacity: 0.13, depthWrite: false }),
    );
    aura.position.set(0, 2.9, -0.18);
    couple.add(aura);
    const groundShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 40),
      new THREE.MeshBasicMaterial({ color: 0x170b06, transparent: true, opacity: 0.32, depthWrite: false }),
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.scale.y = 0.38;
    groundShadow.position.set(0, 0.04, 0.18);
    couple.add(groundShadow);
    const rimLight = new THREE.PointLight(0xffd18d, 14, 8, 2);
    rimLight.position.set(0, 3.4, -1.1);
    if (!mobileDevice) couple.add(rimLight);
    couple.position.set(0, 1.63, -19.25);
    couple.userData = { id: "couple", label: "Temui pasangan" };
    scene.add(couple);
    const coupleSign = makeLabel("TEMUI PASANGAN", "ARAHKAN + TEKAN E");
    coupleSign.position.set(0, 6.45, -19.1);
    scene.add(coupleSign);
    hotspots.push(couple);

    // Articulated low-poly doves: real 3D bodies with independently animated
    // wings, layered feathers, tail and banking turns.
    const doveWhite = new THREE.MeshStandardMaterial({
        color: 0xfffdf7,
        roughness: 0.72,
      }),
      doveShade = new THREE.MeshStandardMaterial({
        color: 0xe4ded5,
        roughness: 0.78,
      }),
      dovePink = new THREE.MeshStandardMaterial({
        color: 0xd68d82,
        roughness: 0.7,
      }),
      doveEye = new THREE.MeshBasicMaterial({ color: 0x130d0a }),
      doveSphere = new THREE.SphereGeometry(1, 12, 9);
    const makeDove = (size = 1) => {
      const bird = new THREE.Group();
      const part = (geometry, material, position, scale, parent = bird) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.scale.set(...scale);
        parent.add(mesh);
        return mesh;
      };
      part(doveSphere, doveWhite, [0, 0, 0], [0.3, 0.27, 0.66]);
      part(doveSphere, doveWhite, [0, 0.18, 0.56], [0.23, 0.23, 0.25]);
      const beak = part(
        new THREE.ConeGeometry(0.075, 0.24, 8),
        dovePink,
        [0, 0.14, 0.82],
        [1, 1, 1],
      );
      beak.rotation.x = Math.PI / 2;
      [-1, 1].forEach((side) =>
        part(doveSphere, doveEye, [side * 0.145, 0.24, 0.7], [0.035, 0.035, 0.025]),
      );
      const wings = [-1, 1].map((side) => {
        const wing = new THREE.Group();
        wing.position.set(side * 0.2, 0.08, 0.05);
        bird.add(wing);
        part(doveSphere, doveWhite, [side * 0.42, 0, 0], [0.58, 0.075, 0.27], wing);
        for (let feather = 0; feather < 5; feather += 1) {
          const length = 0.54 - feather * 0.055;
          const plume = part(
            doveSphere,
            feather % 2 ? doveShade : doveWhite,
            [side * (0.58 + feather * 0.1), -0.015, -0.08 - feather * 0.04],
            [length, 0.045, 0.105],
            wing,
          );
          plume.rotation.y = side * (0.12 + feather * 0.035);
        }
        return wing;
      });
      [-1, 0, 1].forEach((tail) => {
        const feather = part(
          doveSphere,
          tail ? doveShade : doveWhite,
          [tail * 0.13, -0.03, -0.66],
          [0.14, 0.055, 0.43],
        );
        feather.rotation.y = tail * 0.17;
      });
      bird.scale.setScalar(size);
      bird.userData.wings = wings;
      scene.add(bird);
      return bird;
    };
    const podiumDove = makeDove(0.72);
    const ballroomDove = makeDove(0.88);

    // Aisle composition: carpet, floral plinths, candles and falling petals.
    box([0, 0.025, -6], [4.25, 0.045, 27], velvet);
    for (let z = -15; z <= 14; z += lowEndMobile ? 9.2 : mobileDevice ? 6.2 : 4.2) {
      for (const side of [-1, 1]) {
        const x = side * 2.85;
        cyl([x, 0.45, z], 0.3, 0.9, gold);
        const aisleFlowers = flowerCluster(
          x,
          z,
          (Math.round(z) + side) % 2 ? dustyRose : cream,
          0.62,
          0.62,
        );
        aisleFlowers.rotation.y = side * -0.2;
        cyl([x + side * 0.72, 0.32, z + 0.5], 0.055, 0.64, ivory);
        sphere([x + side * 0.72, 0.68, z + 0.5], 0.09, glow);
      }
    }
    for (let n = 0; n < 42; n += 1) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), n % 3 ? blush : ivory);
      petal.scale.set(1.8, 0.35, 0.9);
      petal.position.set((Math.random() - 0.5) * 8, 0.12, -18 + Math.random() * 35);
      petal.rotation.y = Math.random() * Math.PI;
      scene.add(petal);
    }

    // Hanging chandeliers and wall lantern rhythm fill the upper volume.
    for (const z of mobileDevice ? [-4] : [-12, -2, 8]) {
      torus([0, 8.6, z], 1.25, 0.055, gold).rotation.x = Math.PI / 2;
      cyl([0, 9.65, z], 0.035, 2.0, gold);
      for (let a = 0; a < 10; a += 1) {
        const angle = (a / 10) * Math.PI * 2;
        sphere([Math.cos(angle) * 1.2, 8.45, z + Math.sin(angle) * 1.2], 0.1, glow);
      }
    }
    for (const side of [-1, 1])
      for (let z = -16; z <= 16; z += mobileDevice ? 12 : 6) {
      box([side * 16.6, 3.1, z], [0.18, 1.5, 0.75], gold);
      sphere([side * 16.45, 3.15, z], 0.2, glow);
      }
    for (const side of [-1, 1])
      for (const z of mobileDevice ? [-5] : [-12, 0]) {
        cyl([side * 8.5, 0.75, z], 1.45, 0.18);
        cyl([side * 8.5, 0.36, z], 0.22, 0.7, gold);
        for (let a = 0; a < 6; a++) {
          const x = side * 8.5 + Math.cos((a * Math.PI) / 3) * 2,
            zz = z + Math.sin((a * Math.PI) / 3) * 2;
          box([x, 0.55, zz], [0.75, 1.1, 0.75], velvet).rotation.y =
            (-a * Math.PI) / 3;
        }
      }
    const keys = {},
      velocity = new THREE.Vector3(),
      direction = new THREE.Vector3(),
      forward = new THREE.Vector3(),
      right = new THREE.Vector3(),
      screenCenter = new THREE.Vector2(),
      clock = new THREE.Clock(),
      ray = new THREE.Raycaster();
    let yaw = 0,
      pitch = 0,
      current = null,
      frame;
    const down = (e) => {
        const code = e.detail?.code || e.code;
        keys[code] = true;
        if (code === "KeyE" && current) ir.current(current.userData.id);
      },
      up = (e) => (keys[e.detail?.code || e.code] = false),
      mouse = (e) => {
        if (document.pointerLockElement === renderer.domElement && ar.current) {
          yaw -= e.movementX * 0.0022;
          pitch = Math.max(-1.25, Math.min(1.25, pitch - e.movementY * 0.0022));
        }
      },
      mobileMove = new THREE.Vector2(),
      moveControl = (event) =>
        mobileMove.set(event.detail?.x || 0, event.detail?.y || 0),
      lock = () =>
        ar.current &&
        !window.matchMedia("(pointer: coarse)").matches &&
        renderer.domElement.requestPointerLock?.();
    let touchLook = null;
    const touchStart = (event) => {
        if (event.pointerType !== "touch" || !ar.current) return;
        touchLook = { id: event.pointerId, x: event.clientX, y: event.clientY };
        renderer.domElement.setPointerCapture?.(event.pointerId);
      },
      touchMove = (event) => {
        if (!touchLook || event.pointerId !== touchLook.id || !ar.current) return;
        event.preventDefault();
        yaw -= (event.clientX - touchLook.x) * 0.006;
        pitch = Math.max(
          -1.05,
          Math.min(1.05, pitch - (event.clientY - touchLook.y) * 0.005),
        );
        touchLook.x = event.clientX;
        touchLook.y = event.clientY;
      },
      touchEnd = (event) => {
        if (touchLook?.id === event.pointerId) touchLook = null;
      };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("ag-control-down", down);
    window.addEventListener("ag-control-up", up);
    window.addEventListener("ag-mobile-move", moveControl);
    window.addEventListener("mousemove", mouse);
    renderer.domElement.addEventListener("click", lock);
    renderer.domElement.addEventListener("pointerdown", touchStart);
    renderer.domElement.addEventListener("pointermove", touchMove);
    renderer.domElement.addEventListener("pointerup", touchEnd);
    renderer.domElement.addEventListener("pointercancel", touchEnd);
    let lastMobileFrame = 0;
    const animate = (timestamp = 0) => {
      frame = requestAnimationFrame(animate);
      if (mobileDevice && timestamp - lastMobileFrame < 32) return;
      if (mobileDevice) lastMobileFrame = timestamp;
      const dt = Math.min(clock.getDelta(), 0.04);
      camera.rotation.set(pitch, yaw, 0, "YXZ");
      if (ar.current) {
        direction.set(
          mobileMove.x || (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0),
          0,
          mobileMove.y || (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0),
        );
        if (direction.lengthSq()) direction.normalize();
        const speed = keys.ShiftLeft ? 8.5 : 4.3;
        velocity.x = THREE.MathUtils.damp(
          velocity.x,
          direction.x * speed,
          9,
          dt,
        );
        velocity.z = THREE.MathUtils.damp(
          velocity.z,
          direction.z * speed,
          9,
          dt,
        );
        forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        right.set(Math.cos(yaw), 0, -Math.sin(yaw));
        camera.position.addScaledVector(right, velocity.x * dt);
        camera.position.addScaledVector(forward, velocity.z * dt);
        camera.position.x = THREE.MathUtils.clamp(
          camera.position.x,
          -15.5,
          15.5,
        );
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -17.2, 20);
        ray.setFromCamera(screenCenter, camera);
        current =
          ray.intersectObjects(hotspots, true).find((h) => h.distance < 5.5)
            ?.object || null;
        while (current && !current.userData.id) current = current.parent;
        nr.current(current?.userData.label || "");
      }
      hotspots.forEach((h, n) => {
        if (h !== couple) {
          h.rotation.y += dt * (0.5 + n * 0.03);
          h.position.y += Math.sin(clock.elapsedTime * 1.6 + n) * 0.0015;
        }
      });
      // Keep the couple alive without making the cutout look floaty or shaky.
      const t = clock.elapsedTime;
      const podiumAngle = t * 0.62;
      podiumDove.position.set(
        Math.cos(podiumAngle) * 5.1,
        5.25 + Math.sin(t * 2.2) * 0.32,
        -19.6 + Math.sin(podiumAngle) * 2.8,
      );
      const podiumFlap = Math.sin(t * 7.4) * 0.82;
      podiumDove.userData.wings[0].rotation.z = -podiumFlap;
      podiumDove.userData.wings[1].rotation.z = podiumFlap;
      podiumDove.rotation.set(
        Math.sin(t * 2.2) * 0.08,
        Math.atan2(-Math.sin(podiumAngle) * 5.1, Math.cos(podiumAngle) * 2.8),
        -0.22,
      );
      const roomAngle = t * 0.2 + Math.PI;
      ballroomDove.position.set(
        Math.cos(roomAngle) * 13.2,
        6.7 + Math.sin(t * 0.85) * 0.7,
        -2 + Math.sin(roomAngle) * 17,
      );
      const roomFlap = Math.sin(t * 5.1 + 1.2) * 0.68;
      ballroomDove.userData.wings[0].rotation.z = -roomFlap;
      ballroomDove.userData.wings[1].rotation.z = roomFlap;
      ballroomDove.rotation.set(
        Math.cos(t * 0.85) * 0.06,
        Math.atan2(-Math.sin(roomAngle) * 13.2, Math.cos(roomAngle) * 17),
        -0.16,
      );
      const breathing = 1 + Math.sin(t * 1.65) * 0.006;
      couple.scale.set(breathing, breathing, 1);
      couple.position.y = 1.63 + Math.sin(t * 1.05) * 0.026;
      couple.rotation.z = Math.sin(t * 0.62) * 0.006;
      const lookAtPlayer = THREE.MathUtils.clamp(
        Math.atan2(
          camera.position.x - couple.position.x,
          camera.position.z - couple.position.z,
        ),
        -0.16,
        0.16,
      );
      couple.rotation.y = THREE.MathUtils.damp(
        couple.rotation.y,
        lookAtPlayer,
        1.8,
        dt,
      );
      aura.material.opacity = 0.12 + Math.sin(t * 1.35) * 0.018;
      if (!mobileDevice)
        rimLight.intensity = 13.5 + Math.sin(t * 1.7) * 1.5;
      renderer.render(scene, camera);
    };
    animate();
    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("ag-control-down", down);
      window.removeEventListener("ag-control-up", up);
      window.removeEventListener("ag-mobile-move", moveControl);
      window.removeEventListener("mousemove", mouse);
      renderer.domElement.removeEventListener("pointerdown", touchStart);
      renderer.domElement.removeEventListener("pointermove", touchMove);
      renderer.domElement.removeEventListener("pointerup", touchEnd);
      renderer.domElement.removeEventListener("pointercancel", touchEnd);
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);
  return <div className="ag-webgl" ref={mount} />;
}
function MobileControls() {
  return (
    <div
      className="ag-mobile-controls"
      style={{ bottom: "max(64px, env(safe-area-inset-bottom))" }}
    >
      <MobileJoystick />
      <button
        className="action"
        style={{ marginRight: 72 }}
        onPointerDown={(event) => pulseControl(event, "KeyE")}
      >
        E
      </button>
    </div>
  );
}
function MobileJoystick() {
  const base = useRef(null);
  const knob = useRef(null);
  const activePointer = useRef(null);
  const update = (event) => {
    const rect = base.current.getBoundingClientRect();
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const radius = 37;
    const distance = Math.hypot(x, y);
    if (distance > radius) {
      x = (x / distance) * radius;
      y = (y / distance) * radius;
    }
    knob.current.style.transform = `translate(${x}px, ${y}px)`;
    dispatchMove(x / radius, -y / radius);
  };
  const start = (event) => {
    event.preventDefault();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    update(event);
  };
  const move = (event) => {
    if (activePointer.current === event.pointerId) update(event);
  };
  const stop = (event) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    knob.current.style.transform = "translate(0, 0)";
    dispatchMove(0, 0);
  };
  return (
    <div
      ref={base}
      aria-label="Joystick untuk berjalan"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={stop}
      onPointerCancel={stop}
      style={{
        position: "relative",
        display: "block",
        width: 112,
        height: 112,
        border: "1px solid rgba(255,255,255,.42)",
        borderRadius: "50%",
        background: "rgba(25,13,8,.58)",
        boxShadow: "inset 0 0 25px rgba(0,0,0,.35)",
        pointerEvents: "auto",
        touchAction: "none",
      }}
    >
      <i
        ref={knob}
        style={{
          position: "absolute",
          left: 33,
          top: 33,
          width: 46,
          height: 46,
          border: "1px solid #e3c17f",
          borderRadius: "50%",
          background: "linear-gradient(145deg,#b98745,#6f431f)",
          boxShadow: "0 8px 18px rgba(0,0,0,.45)",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
function pulseControl(event, code) {
  event.preventDefault();
  dispatchControl(code, true);
  dispatchControl(code, false);
}
function dispatchControl(code, down) {
  window.dispatchEvent(
    new CustomEvent(down ? "ag-control-down" : "ag-control-up", {
      detail: { code },
    }),
  );
}
function dispatchMove(x, y) {
  window.dispatchEvent(
    new CustomEvent("ag-mobile-move", { detail: { x, y } }),
  );
}
function Panel({ eyebrow, title, children }) {
  return (
    <article className="ag-info-panel">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </article>
  );
}
function Person({ photo, name, parents }) {
  return (
    <div>
      <img src={photo} />
      <h3>{name}</h3>
      <p>
        Putra/putri dari
        <br />
        {parents}
      </p>
    </div>
  );
}
function Event({ title, date, time, venue }) {
  return (
    <div className="ag-panel-event">
      <small>{title}</small>
      <strong>{dateText(date)}</strong>
      <span>
        {String(time).slice(0, 5)} WIB · {venue}
      </span>
    </div>
  );
}
