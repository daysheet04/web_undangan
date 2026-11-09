var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/templates/LunaraAzureTemplate.jsx
var LunaraAzureTemplate_exports = {};
__export(LunaraAzureTemplate_exports, {
  default: () => LunaraAzureTemplate
});
module.exports = __toCommonJS(LunaraAzureTemplate_exports);

// <define:import.meta.env>
var define_import_meta_env_default = {};

// src/templates/LunaraAzureTemplate.jsx
var import_react2 = __toESM(require("react"), 1);

// src/lib/api.js
var configuredApiBase = String(define_import_meta_env_default.VITE_API_BASE_URL || "").replace(/\/$/, "");
var pointsToLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiBase);
var API_BASE = define_import_meta_env_default.DEV || pointsToLocalhost ? "" : configuredApiBase;
function mediaUrl(path) {
  if (!path) return "/assets/images/templates/placeholder-couple.svg";
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  if (path.startsWith("uploads/")) return "/" + path;
  const cleanPath = String(path).replace(/^\/+/, "");
  if (typeof window !== "undefined" && (window.location.port === "8081" || window.location.pathname.startsWith("/admin"))) {
    return (API_BASE ? API_BASE : "") + "/api/admin/media/" + cleanPath;
  }
  return (API_BASE ? API_BASE : "") + "/media/" + cleanPath;
}

// src/components/TemplateFooter.jsx
var import_react = __toESM(require("react"), 1);
function TemplateFooter({ className = "" }) {
  return /* @__PURE__ */ import_react.default.createElement("footer", { className: `template-footer daymoment-template-footer ${className}`.trim() }, /* @__PURE__ */ import_react.default.createElement(
    "img",
    {
      src: "/assets/images/brand/daymoment-logo.webp",
      alt: "Daymoment",
      width: "180",
      height: "64",
      loading: "lazy",
      decoding: "async"
    }
  ), /* @__PURE__ */ import_react.default.createElement("p", null, "Semoga setiap momen bahagiamu selalu dipenuhi berkah dan kebahagiaan."));
}

// src/templates/lunara-demo-images.json
var lunara_demo_images_default = {
  "template-gallery/lunara_azure/essential/slot-1-fa4ba23d-93da-4703-ae53-66df7fdac268.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-480.webp",
      width: 480,
      height: 715,
      bytes: 57974
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-800.webp",
      width: 800,
      height: 1192,
      bytes: 110982
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 188426
    }
  ],
  "template-gallery/lunara_azure/essential/slot-2-7fdca453-6f2b-4112-a1ab-a9d200b0d0f0.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-480.webp",
      width: 480,
      height: 715,
      bytes: 48324
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-800.webp",
      width: 800,
      height: 1192,
      bytes: 95438
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 168314
    }
  ],
  "template-gallery/lunara_azure/prestige/slot-1-97e86a40-f65f-41f3-a508-4fd6bc508a9a.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-480.webp",
      width: 480,
      height: 715,
      bytes: 48324
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-800.webp",
      width: 800,
      height: 1192,
      bytes: 95438
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 168314
    }
  ],
  "template-gallery/lunara_azure/prestige/slot-2-eb0dcecd-dd28-4ed8-a55c-96a061d665ac.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-480.webp",
      width: 480,
      height: 643,
      bytes: 40906
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-800.webp",
      width: 800,
      height: 1071,
      bytes: 77520
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 131808
    }
  ],
  "template-gallery/lunara_azure/prestige/slot-3-a00a732a-61f3-448a-9232-10bf5f88e84e.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-480.webp",
      width: 480,
      height: 643,
      bytes: 53094
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-800.webp",
      width: 800,
      height: 1071,
      bytes: 101726
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 166632
    }
  ],
  "template-gallery/lunara_azure/prestige/slot-4-98728b4f-b3af-4758-88ac-b033ca933ccd.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/8e2ee6f7a2cd90b8ea3b-480.webp",
      width: 480,
      height: 643,
      bytes: 64184
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/8e2ee6f7a2cd90b8ea3b-800.webp",
      width: 800,
      height: 1071,
      bytes: 120932
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/8e2ee6f7a2cd90b8ea3b-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 200366
    }
  ],
  "template-gallery/lunara_azure/prestige/slot-5-4298bd8e-8a65-4fb7-a4a3-a4fecb520a67.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-480.webp",
      width: 480,
      height: 715,
      bytes: 57974
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-800.webp",
      width: 800,
      height: 1192,
      bytes: 110982
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 188426
    }
  ],
  "template-gallery/lunara_azure/signature/slot-1-2b27843d-3821-413c-9e8d-041b4c68f61f.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-480.webp",
      width: 480,
      height: 643,
      bytes: 40906
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-800.webp",
      width: 800,
      height: 1071,
      bytes: 77520
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/4e535689f68e9dd02dcf-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 131808
    }
  ],
  "template-gallery/lunara_azure/signature/slot-2-3c6719b7-491a-4fa4-9d30-d0744afb4805.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-480.webp",
      width: 480,
      height: 715,
      bytes: 57974
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-800.webp",
      width: 800,
      height: 1192,
      bytes: 110982
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/38d8de2d93925fe2fde5-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 188426
    }
  ],
  "template-gallery/lunara_azure/signature/slot-3-7360cfb5-e0f7-4d40-a921-d3908a73227f.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-480.webp",
      width: 480,
      height: 643,
      bytes: 51314
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-800.webp",
      width: 800,
      height: 1071,
      bytes: 108378
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 204012
    }
  ],
  "template-photos/lunara_azure/bride_photo-d9efd273-6641-48f7-b9b9-6566cfd9f7a5.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/695b1e103e3e2e578d9c-480.webp",
      width: 480,
      height: 643,
      bytes: 46722
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/695b1e103e3e2e578d9c-800.webp",
      width: 800,
      height: 1071,
      bytes: 95328
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/695b1e103e3e2e578d9c-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 165514
    }
  ],
  "template-photos/lunara_azure/essential-cover_image-885ea7bb-0b60-46b8-af55-b66dfba8afe3.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-480.webp",
      width: 480,
      height: 643,
      bytes: 53094
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-800.webp",
      width: 800,
      height: 1071,
      bytes: 101726
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/fce640160110d6212657-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 166632
    }
  ],
  "template-photos/lunara_azure/groom_photo-ad154443-8960-4c5a-a63f-d0c0dd039d1b.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/699f604393bd1e49866f-480.webp",
      width: 480,
      height: 747,
      bytes: 29252
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/699f604393bd1e49866f-800.webp",
      width: 800,
      height: 1244,
      bytes: 54184
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/699f604393bd1e49866f-1200.webp",
      width: 1200,
      height: 1867,
      bytes: 92332
    }
  ],
  "template-photos/lunara_azure/prestige-cover_image-31fea96f-10d9-4214-98e4-36961993aea2.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-480.webp",
      width: 480,
      height: 643,
      bytes: 51314
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-800.webp",
      width: 800,
      height: 1071,
      bytes: 108378
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/ac2e88101257482a7dac-1200.webp",
      width: 1200,
      height: 1607,
      bytes: 204012
    }
  ],
  "template-photos/lunara_azure/signature-cover_image-501bdf20-a023-45c1-92f3-0e1cb50213c7.jpg": [
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-480.webp",
      width: 480,
      height: 715,
      bytes: 48324
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-800.webp",
      width: 800,
      height: 1192,
      bytes: 95438
    },
    {
      src: "/assets/images/templates/lunara-azure/demo/30abe5c7b39153f2f90b-1200.webp",
      width: 1200,
      height: 1789,
      bytes: 168314
    }
  ]
};

// src/templates/LunaraAzureTemplate.jsx
var ASSET = "/assets/images/templates/lunara-azure/";
var LAYER_ASSET = `${ASSET}layers/`;
var MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
var DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
var fallbackDate = () => {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + 45);
  return date.toISOString().slice(0, 10);
};
var idDate = (value, day = true) => {
  const date = /* @__PURE__ */ new Date(`${value || fallbackDate()}T12:00:00`);
  return `${day ? `${DAYS[date.getDay()]}, ` : ""}${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
var timeRange = (start, end) => `${String(start || "").slice(0, 5)}${end ? ` \u2013 ${String(end).slice(0, 5)}` : ""} WIB`;
var attendance = (value) => ({ attending: "Hadir", not_attending: "Tidak Hadir", unsure: "Masih Ragu" })[value] || "Masih Ragu";
function LunaraPhoto({ src, ...props }) {
  const key = String(src || "").split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/, "").replace(/^\/(?:api\/admin\/)?media\//, "");
  const variants = lunara_demo_images_default[key];
  if (!variants) return /* @__PURE__ */ import_react2.default.createElement("img", { src, decoding: "async", ...props });
  const fallback = variants.find((image) => image.width === 800) || variants[variants.length - 1];
  return /* @__PURE__ */ import_react2.default.createElement(
    "img",
    {
      src: fallback.src,
      srcSet: variants.map((image) => `${image.src} ${image.width}w`).join(", "),
      sizes: "(max-width: 600px) calc(100vw - 48px), (max-width: 900px) 50vw, 440px",
      width: fallback.width,
      height: fallback.height,
      decoding: "async",
      ...props,
      onError: (event) => {
        const image = event.currentTarget;
        if (!image.hasAttribute("srcset")) return;
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.src = src;
      }
    }
  );
}
function LunaraAzureTemplate({ invitation: i, media, giftAccounts, greetings, guestName, guestSalutation, preview }) {
  const bride = i.bride_nickname || "Nisa";
  const groom = i.groom_nickname || "Andi";
  const limit = Math.max(1, Number(i.gallery_limit) || 5);
  const photos = media.slice(0, limit);
  const cover = mediaUrl(i.cover_image);
  const bridePhoto = mediaUrl(i.bride_photo || media[0]?.file_path || i.cover_image);
  const groomPhoto = mediaUrl(i.groom_photo || media[1]?.file_path || i.cover_image);
  const eventDate = i.reception_date || fallbackDate();
  const eventTime = String(i.reception_start_time || "11:00").slice(0, 5);
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Pernikahan ${bride} & ${groom}`)}&dates=${eventDate.replaceAll("-", "")}T${eventTime.replace(":", "")}00/${eventDate.replaceAll("-", "")}T${eventTime.replace(":", "")}00&location=${encodeURIComponent(i.venue_name || "")}`;
  const [lightbox, setLightbox] = (0, import_react2.useState)(null);
  const touchStartX = (0, import_react2.useRef)(0);
  const openPhoto = (photo) => {
    setLightbox({
      items: [photo],
      index: 0
    });
  };
  const openGalleryPhoto = (index) => {
    const galleryItems = (photos.length ? photos : Array.from({ length: limit })).map((p, idx) => ({
      src: p ? mediaUrl(p.file_path) : cover,
      title: `Memory \xB7 ${String(idx + 1).padStart(2, "0")}`,
      caption: `${groom} & ${bride} \u2014 Momen Bahagia`
    }));
    setLightbox({
      items: galleryItems,
      index: Math.max(0, Math.min(index, galleryItems.length - 1))
    });
  };
  const nextPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index + 1) % prev.items.length } : prev);
  };
  const prevPhoto = () => {
    setLightbox((prev) => prev && prev.items.length > 1 ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : prev);
  };
  (0, import_react2.useEffect)(() => {
    if (!lightbox) return void 0;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightbox(null);
      } else if (e.key === "ArrowRight" && lightbox.items.length > 1) {
        nextPhoto();
      } else if (e.key === "ArrowLeft" && lightbox.items.length > 1) {
        prevPhoto();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightbox]);
  return /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement(AzureSymbols, null), /* @__PURE__ */ import_react2.default.createElement("div", { className: "invitation-page lunara-azure", "data-template-root": true, "data-slug": i.slug || "" }, /* @__PURE__ */ import_react2.default.createElement("section", { className: "opening-cover lunara-cover", "aria-label": "Cover undangan" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-sky" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-opening-light", "data-opening-step": true, style: { "--open-step": 0 } }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-panel panel-left" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-panel panel-right" }), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "opening-garden opening-garden-left", opening: true, choreo: "opening" }), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "opening-garden opening-garden-right", opening: true, choreo: "opening-reverse" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-orbit", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement("i", null), /* @__PURE__ */ import_react2.default.createElement("i", null), /* @__PURE__ */ import_react2.default.createElement("i", null)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-card", "data-cover-content": true }, /* @__PURE__ */ import_react2.default.createElement("small", { "data-opening-step": true, style: { "--open-step": 6, "--open-delay": "2.5s" } }, "Daymoment mempersembahkan"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-moon-mark", "data-opening-step": true, style: { "--open-step": 6.7, "--open-delay": "3.4s" } }, /* @__PURE__ */ import_react2.default.createElement("i", null)), /* @__PURE__ */ import_react2.default.createElement("p", { "data-opening-step": true, style: { "--open-step": 7.5, "--open-delay": "4.4s" } }, "The Wedding of"), /* @__PURE__ */ import_react2.default.createElement("h1", { className: "lunara-name-stack" }, /* @__PURE__ */ import_react2.default.createElement("span", { "data-opening-step": true, style: { "--open-step": 8.3, "--open-delay": "5.25s" }, "data-live": "groom_nickname" }, groom), /* @__PURE__ */ import_react2.default.createElement("em", { "data-opening-step": true, style: { "--open-step": 9.1, "--open-delay": "6.15s" } }, "&"), /* @__PURE__ */ import_react2.default.createElement("span", { "data-opening-step": true, style: { "--open-step": 9.9, "--open-delay": "7.05s" }, "data-live": "bride_nickname" }, bride)), /* @__PURE__ */ import_react2.default.createElement("time", { "data-opening-step": true, style: { "--open-step": 10.8, "--open-delay": "7.95s" }, "data-date-field": "reception_date" }, idDate(eventDate, false)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-cover-guest", "data-opening-step": true, style: { "--open-step": 11.7, "--open-delay": "8.85s" } }, /* @__PURE__ */ import_react2.default.createElement("span", null, guestSalutation), /* @__PURE__ */ import_react2.default.createElement("strong", null, guestName)), /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-button lunara-button-light open-invitation", type: "button", "data-opening-step": true, style: { "--open-step": 12.6, "--open-delay": "9.95s" }, "data-open-invitation": true }, /* @__PURE__ */ import_react2.default.createElement("span", null, "Buka Undangan"), /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-arrow" })))), /* @__PURE__ */ import_react2.default.createElement("main", { className: "invitation-content lunara-content" }, /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-hero", "data-lunara-scene": true, "data-lunara-bg": "lunara-hero-aurora-collage-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement("div", { className: "porcelain-glow" }), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden hero-sequence-garden garden-hero-left", choreo: "fan", sequence: true }), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden hero-sequence-garden garden-hero-right", choreo: "reverse", sequence: true }), /* @__PURE__ */ import_react2.default.createElement(FlyingButterfly, { className: "lunara-travelling-butterfly" }), /* @__PURE__ */ import_react2.default.createElement(FlyingButterfly, { className: "lunara-crossing-butterfly lunara-crossing-butterfly-one" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-hero-copy" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-eyebrow", "data-hero-step": "eyebrow" }, "The Wedding of"), /* @__PURE__ */ import_react2.default.createElement("h2", { "data-hero-step": "names" }, /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": "bride_nickname" }, bride), /* @__PURE__ */ import_react2.default.createElement("i", null, "&"), /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": "groom_nickname" }, groom)), /* @__PURE__ */ import_react2.default.createElement("p", { "data-hero-step": "invitation" }, "Kami mengundang Anda untuk menjadi bagian dari babak terindah perjalanan kami."), /* @__PURE__ */ import_react2.default.createElement("time", { "data-hero-step": "date", "data-date-field": "reception_date" }, idDate(eventDate))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-portrait-stage" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-mirror-bottom-frame", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement("img", { src: `${LAYER_ASSET}mirror-bottom-frame-v2.webp`, alt: "", decoding: "async" })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-mirror-surface", "data-hero-step": "portrait" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-photo-orbit" }, /* @__PURE__ */ import_react2.default.createElement("i", null), /* @__PURE__ */ import_react2.default.createElement("i", null)), /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "lunara-hero-photo lunara-clickable-photo",
      onClick: () => openPhoto({ src: cover, title: `${groom} & ${bride}`, caption: "Foto Sampul \u2014 Our beautiful moment" }),
      role: "button",
      tabIndex: 0,
      "aria-label": "Lihat foto sampul ukuran penuh",
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPhoto({ src: cover, title: `${groom} & ${bride}`, caption: "Foto Sampul \u2014 Our beautiful moment" });
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement(LunaraPhoto, { src: cover, alt: "Foto pasangan", fetchPriority: "high" }),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-photo-zoom-hint", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-zoom" })),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-photo-label", "data-hero-caption": true }, "Our beautiful moment")
  ))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-countdown", "data-hero-step": "countdown", "data-countdown": `${eventDate}T${eventTime}:00+07:00` }, [["days", "Hari"], ["hours", "Jam"], ["minutes", "Menit"], ["seconds", "Detik"]].map(([key, label]) => /* @__PURE__ */ import_react2.default.createElement("div", { key }, /* @__PURE__ */ import_react2.default.createElement("strong", { ...{ [`data-${key}`]: "" } }, "00"), /* @__PURE__ */ import_react2.default.createElement("span", null, label)))), /* @__PURE__ */ import_react2.default.createElement("a", { className: "lunara-button lunara-save-date", "data-hero-step": "button", href: calendar, target: "_blank", rel: "noreferrer" }, "Simpan Tanggal ", /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-arrow" }))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-greeting", "data-lunara-scene": true, "data-lunara-bg": "lunara-wedding-aurora-ceremony-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-stars", "aria-hidden": "true" }, Array.from({ length: 9 }, (_, index) => /* @__PURE__ */ import_react2.default.createElement("i", { key: index }))), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-greeting", choreo: "orbit" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-greeting-inner", "data-lunara-reveal": "tilt" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-eyebrow" }, "Dengan penuh rasa syukur"), /* @__PURE__ */ import_react2.default.createElement("h2", null, "The Wedding"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "lunara-arabic" }, "\u0627\u0644\u0633\u064E\u0651\u0644\u064E\u0627\u0645\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u0652 \u0648\u064E\u0631\u064E\u062D\u0652\u0645\u064E\u0629\u064F \u0627\u0644\u0644\u0647\u0650 \u0648\u064E\u0628\u064E\u0631\u064E\u0643\u064E\u0627\u062A\u064F\u0647\u064F"), /* @__PURE__ */ import_react2.default.createElement("p", null, "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami."), /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-signature" }, bride, " ", /* @__PURE__ */ import_react2.default.createElement("i", null, "&"), " ", groom))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-couple", "data-lunara-scene": true, "data-lunara-bg": "lunara-couple-editorial-collage-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-couple", choreo: "bloom" }), /* @__PURE__ */ import_react2.default.createElement(SectionHeading, { eyebrow: "Dua hati, satu tujuan", title: "Mempelai" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-couple-grid" }, /* @__PURE__ */ import_react2.default.createElement(
    PersonCard,
    {
      type: "bride",
      photo: bridePhoto,
      full: i.bride_full_name || "Nisa Maharani",
      father: i.bride_father || "Bapak Firmansyah",
      mother: i.bride_mother || "Ibu Lestari",
      onPhotoClick: () => openPhoto({ src: bridePhoto, title: i.bride_full_name || `${bride} \u2014 Mempelai Wanita`, caption: `Putri dari ${i.bride_father || "Bapak Firmansyah"} & ${i.bride_mother || "Ibu Lestari"}` })
    }
  ), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-couple-amp", "data-lunara-reveal": "spin" }, /* @__PURE__ */ import_react2.default.createElement("span", null, "&"), /* @__PURE__ */ import_react2.default.createElement("i", null)), /* @__PURE__ */ import_react2.default.createElement(
    PersonCard,
    {
      type: "groom",
      photo: groomPhoto,
      full: i.groom_full_name || "Andi Pratama",
      father: i.groom_father || "Bapak Suryanto",
      mother: i.groom_mother || "Ibu Rahayu",
      onPhotoClick: () => openPhoto({ src: groomPhoto, title: i.groom_full_name || `${groom} \u2014 Mempelai Pria`, caption: `Putra dari ${i.groom_father || "Bapak Suryanto"} & ${i.groom_mother || "Ibu Rahayu"}` })
    }
  ))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-events", "data-lunara-scene": true, "data-lunara-bg": "lunara-events-editorial-flow-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-events", choreo: "rise" }), /* @__PURE__ */ import_react2.default.createElement(SectionHeading, { eyebrow: "Catat hari bahagia kami", title: "Rangkaian Acara" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-event-date", "data-lunara-reveal": "rise" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, (/* @__PURE__ */ new Date(`${eventDate}T12:00:00`)).getDate()), /* @__PURE__ */ import_react2.default.createElement("span", null, MONTHS[(/* @__PURE__ */ new Date(`${eventDate}T12:00:00`)).getMonth()], /* @__PURE__ */ import_react2.default.createElement("i", null), (/* @__PURE__ */ new Date(`${eventDate}T12:00:00`)).getFullYear())), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-event-deck" }, /* @__PURE__ */ import_react2.default.createElement(EventCard, { type: "akad", invitation: i }), /* @__PURE__ */ import_react2.default.createElement(EventCard, { type: "reception", invitation: i }))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-story", "data-lunara-scene": true, "data-lunara-bg": "lunara-story-editorial-memory-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-story", choreo: "drift" }), /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "lunara-story-photo lunara-clickable-photo",
      "data-lunara-reveal": "left",
      onClick: () => openPhoto({ src: cover, title: `${groom} & ${bride}`, caption: "Written in the moonlight \u2014 Kisah Kami" }),
      role: "button",
      tabIndex: 0,
      "aria-label": "Lihat foto kisah ukuran penuh",
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPhoto({ src: cover, title: `${groom} & ${bride}`, caption: "Written in the moonlight \u2014 Kisah Kami" });
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement(LunaraPhoto, { src: cover, alt: "Kisah pasangan", loading: "lazy" }),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-photo-zoom-hint", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-zoom" }))
  ), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-story-copy", "data-lunara-reveal": "tilt" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-eyebrow" }, "Kisah kami"), /* @__PURE__ */ import_react2.default.createElement("h2", null, "Written in", /* @__PURE__ */ import_react2.default.createElement("br", null), "the moonlight"), /* @__PURE__ */ import_react2.default.createElement("p", { "data-live": "love_story" }, i.love_story || "Berawal dari pertemuan sederhana, tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama."))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-gallery", "data-lunara-scene": true, "data-lunara-bg": "lunara-gallery-zine-collage-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-gallery", choreo: "cascade" }), /* @__PURE__ */ import_react2.default.createElement(SectionHeading, { eyebrow: "Kumpulan Momen Indah", title: "Our Memories" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: `lunara-gallery-deck gallery-count-${Math.min(photos.length || limit, 5)}` }, photos.length ? photos.map((photo, index) => /* @__PURE__ */ import_react2.default.createElement(
    "figure",
    {
      key: photo.id,
      className: "lunara-clickable-photo",
      "data-lunara-reveal": index % 2 ? "right" : "left",
      style: { "--card-index": index },
      onClick: () => openGalleryPhoto(index),
      role: "button",
      tabIndex: 0,
      "aria-label": `Lihat foto galeri ${index + 1} ukuran penuh`,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openGalleryPhoto(index);
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement(LunaraPhoto, { src: mediaUrl(photo.file_path), alt: `Momen pasangan ${index + 1}`, loading: "lazy" }),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-photo-zoom-hint", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-zoom" })),
    /* @__PURE__ */ import_react2.default.createElement("figcaption", null, "Memory \xB7 ", String(index + 1).padStart(2, "0"))
  )) : Array.from({ length: limit }, (_, index) => /* @__PURE__ */ import_react2.default.createElement(
    "figure",
    {
      className: "lunara-gallery-placeholder lunara-clickable-photo",
      key: index,
      "data-lunara-reveal": index % 2 ? "right" : "left",
      style: { "--card-index": index },
      onClick: () => openPhoto({ src: cover, title: `Memory \xB7 ${String(index + 1).padStart(2, "0")}`, caption: `${groom} & ${bride}` }),
      role: "button",
      tabIndex: 0,
      "aria-label": `Lihat foto galeri ${index + 1} ukuran penuh`
    },
    /* @__PURE__ */ import_react2.default.createElement("span", null, String(index + 1).padStart(2, "0")),
    /* @__PURE__ */ import_react2.default.createElement("figcaption", null, "Our moment")
  )))), i.has_gift && /* @__PURE__ */ import_react2.default.createElement(GiftSection, { accounts: giftAccounts }), i.has_wishes && /* @__PURE__ */ import_react2.default.createElement(RsvpSection, { invitation: i, guestName, greetings, preview }), /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-closing", "data-lunara-scene": true, "data-lunara-bg": "lunara-closing-editorial-finale-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-closing-moon" }, /* @__PURE__ */ import_react2.default.createElement("i", null)), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-closing", choreo: "finale" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-closing-copy", "data-lunara-reveal": "tilt" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-closing-stamp", "aria-hidden": "true" }, groom.slice(0, 1), " \xB7 ", bride.slice(0, 1)), /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-eyebrow" }, "Terima kasih sudah menjadi bagian cerita kami"), /* @__PURE__ */ import_react2.default.createElement("p", null, "Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."), /* @__PURE__ */ import_react2.default.createElement("h2", { className: "lunara-name-stack" }, /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": "groom_nickname" }, groom), /* @__PURE__ */ import_react2.default.createElement("i", null, "&"), /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": "bride_nickname" }, bride)), /* @__PURE__ */ import_react2.default.createElement("time", { "data-date-field": "reception_date" }, idDate(eventDate, false)), /* @__PURE__ */ import_react2.default.createElement("small", { className: "lunara-closing-note" }, "With love, today and always."))), /* @__PURE__ */ import_react2.default.createElement(TemplateFooter, { className: "lunara-template-footer" })), i.has_music && i.music_file && /* @__PURE__ */ import_react2.default.createElement("audio", { "data-wedding-audio": true, loop: true, preload: "metadata", src: mediaUrl(i.music_file) }), i.has_music && /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-music", type: "button", "data-music-controller": true, "aria-label": "Kontrol musik", "aria-pressed": "false", title: i.music_title || "Musik undangan" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-music" })), lightbox && lightbox.items[lightbox.index] && /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "lunara-lightbox is-open",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Lihat foto penuh",
      onClick: () => setLightbox(null)
    },
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-lightbox-backdrop", "aria-hidden": "true" }),
    /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "lunara-lightbox-close",
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          setLightbox(null);
        },
        "aria-label": "Tutup tampilan foto"
      },
      /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-close" })
    ),
    lightbox.items.length > 1 && /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "lunara-lightbox-nav prev",
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          prevPhoto();
        },
        "aria-label": "Foto sebelumnya"
      },
      /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-chevron-left" })
    ), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        className: "lunara-lightbox-nav next",
        type: "button",
        onClick: (e) => {
          e.stopPropagation();
          nextPhoto();
        },
        "aria-label": "Foto berikutnya"
      },
      /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-chevron-right" })
    )),
    /* @__PURE__ */ import_react2.default.createElement(
      "div",
      {
        className: "lunara-lightbox-dialog",
        onClick: (e) => e.stopPropagation(),
        onTouchStart: (e) => {
          touchStartX.current = e.touches[0].clientX;
        },
        onTouchEnd: (e) => {
          if (lightbox.items.length <= 1) return;
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(diff) > 42) {
            if (diff < 0) nextPhoto();
            else prevPhoto();
          }
        }
      },
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-lightbox-frame" }, /* @__PURE__ */ import_react2.default.createElement(
        "img",
        {
          className: "lunara-lightbox-img",
          src: lightbox.items[lightbox.index].src,
          alt: lightbox.items[lightbox.index].title || "Foto ukuran penuh"
        }
      )),
      /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-lightbox-caption" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, lightbox.items[lightbox.index].title), lightbox.items[lightbox.index].caption && /* @__PURE__ */ import_react2.default.createElement("p", null, lightbox.items[lightbox.index].caption), lightbox.items.length > 1 && /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-lightbox-counter" }, lightbox.index + 1, " / ", lightbox.items.length))
    )
  )));
}
var CHOREOGRAPHY = {
  opening: [0, 2, 3, 1, 4, 5],
  "opening-reverse": [1, 3, 2, 0, 5, 4],
  fan: [0, 3, 1, 2, 5, 4],
  reverse: [3, 2, 1, 0, 4, 5],
  orbit: [3, 0, 2, 1, 5, 4],
  bloom: [0, 1, 3, 2, 4, 5],
  rise: [3, 0, 1, 2, 4, 5],
  drift: [2, 3, 0, 1, 5, 4],
  cascade: [4, 2, 0, 1, 3, 5],
  crown: [3, 2, 1, 0, 5, 4],
  embrace: [0, 3, 2, 1, 4, 5],
  finale: [3, 0, 2, 1, 4, 5]
};
var GARDEN_PIECES = [
  ["foliage", "foliage.webp"],
  ["bloom", "main-bloom.webp"],
  ["spray", "accent-spray.webp"],
  ["vine", "crescent-vine.webp"],
  ["petals", "petals.webp"],
  ["butterfly", "butterfly.webp"]
];
function MotionGarden({ className, choreo = "fan", opening = false, sequence = false }) {
  const order = CHOREOGRAPHY[choreo] || CHOREOGRAPHY.fan;
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: `lunara-motion-garden ${className || ""} choreo-${choreo}`, ...!opening && !sequence ? { "data-lunara-garden": "" } : {}, ...sequence ? { "data-hero-garden": "" } : {}, "aria-hidden": "true" }, GARDEN_PIECES.map(([piece, file], index) => {
    const pieceProps = { key: piece, "data-lunara-piece": "", ...opening ? { "data-opening-step": "" } : {}, style: { "--piece-order": order[index], ...opening ? { "--open-step": order[index] + 1 } : {} } };
    return piece === "butterfly" ? /* @__PURE__ */ import_react2.default.createElement(FlyingButterfly, { className: "garden-piece garden-butterfly", opening, ...pieceProps }) : /* @__PURE__ */ import_react2.default.createElement("img", { className: `garden-piece garden-${piece}`, src: `${LAYER_ASSET}${file}`, alt: "", fetchPriority: opening ? "high" : "auto", decoding: "async", ...pieceProps });
  }));
}
function SectionHeading({ eyebrow, title, reveal = true }) {
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-heading", ...reveal ? { "data-lunara-reveal": "rise" } : {} }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-eyebrow" }, eyebrow), /* @__PURE__ */ import_react2.default.createElement("h2", null, title), /* @__PURE__ */ import_react2.default.createElement("i", null));
}
function SceneTransition() {
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-scene-transition", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement("i", null), /* @__PURE__ */ import_react2.default.createElement("span", null));
}
function FlyingButterfly({ className, style, opening = false, ...props }) {
  const priority = opening ? "high" : "auto";
  return /* @__PURE__ */ import_react2.default.createElement("span", { className, style, ...props, "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-butterfly-model" }, /* @__PURE__ */ import_react2.default.createElement("img", { className: "lunara-butterfly-pose lunara-butterfly-pose-open", src: `${LAYER_ASSET}butterfly.webp`, alt: "", fetchPriority: priority, decoding: "async", draggable: "false" }), /* @__PURE__ */ import_react2.default.createElement("img", { className: "lunara-butterfly-pose lunara-butterfly-pose-quarter", src: `${LAYER_ASSET}butterfly-three-quarter-trim.webp`, alt: "", fetchPriority: priority, decoding: "async", draggable: "false" }), /* @__PURE__ */ import_react2.default.createElement("img", { className: "lunara-butterfly-pose lunara-butterfly-pose-folded", src: `${LAYER_ASSET}butterfly-folded-trim.webp`, alt: "", fetchPriority: priority, decoding: "async", draggable: "false" })));
}
function PersonCard({ type, photo, full, father, mother, onPhotoClick }) {
  return /* @__PURE__ */ import_react2.default.createElement("article", { className: `lunara-person person-${type}`, "data-lunara-reveal": type === "bride" ? "left" : "right" }, /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "lunara-person-photo lunara-clickable-photo",
      onClick: onPhotoClick,
      role: onPhotoClick ? "button" : void 0,
      tabIndex: onPhotoClick ? 0 : void 0,
      "aria-label": onPhotoClick ? `Lihat foto ${type === "bride" ? "mempelai wanita" : "mempelai pria"} ukuran penuh` : void 0,
      onKeyDown: (e) => {
        if (onPhotoClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPhotoClick();
        }
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("span", null),
    /* @__PURE__ */ import_react2.default.createElement(LunaraPhoto, { src: photo, alt: `Foto mempelai ${type === "bride" ? "wanita" : "pria"}`, loading: "lazy" }),
    /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-photo-zoom-hint", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-zoom" }))
  ), /* @__PURE__ */ import_react2.default.createElement("small", null, type === "bride" ? "Mempelai Wanita" : "Mempelai Pria"), /* @__PURE__ */ import_react2.default.createElement("h3", { "data-live": `${type}_full_name` }, full), /* @__PURE__ */ import_react2.default.createElement("p", null, type === "bride" ? "Putri" : "Putra", " dari"), /* @__PURE__ */ import_react2.default.createElement("strong", null, /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": `${type}_father` }, father), /* @__PURE__ */ import_react2.default.createElement("br", null), "& ", /* @__PURE__ */ import_react2.default.createElement("span", { "data-live": `${type}_mother` }, mother)));
}
function EventCard({ type, invitation: i }) {
  const akad = type === "akad";
  const date = i[`${type}_date`] || i.reception_date;
  return /* @__PURE__ */ import_react2.default.createElement("article", { className: `lunara-event-card event-${type}`, "data-lunara-reveal": akad ? "left" : "right" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "event-number" }, akad ? "01" : "02"), /* @__PURE__ */ import_react2.default.createElement("small", null, akad ? "Janji suci" : "Perayaan kasih"), /* @__PURE__ */ import_react2.default.createElement("h3", null, akad ? "Akad Nikah" : "Resepsi"), /* @__PURE__ */ import_react2.default.createElement("time", { "data-date-field": `${type}_date` }, idDate(date)), /* @__PURE__ */ import_react2.default.createElement("strong", { "data-time-range": type }, timeRange(i[`${type}_start_time`], i[`${type}_end_time`])), /* @__PURE__ */ import_react2.default.createElement("p", { "data-live": "venue_name" }, i.venue_name || "Lokasi Acara"), /* @__PURE__ */ import_react2.default.createElement("address", { "data-live": "venue_address" }, i.venue_address || "Alamat lengkap akan diumumkan."), /* @__PURE__ */ import_react2.default.createElement("a", { className: "lunara-button", "data-live-href": "maps_url", href: i.maps_url || "#", target: "_blank", rel: "noreferrer" }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-map" }), " Lihat Lokasi"));
}
function GiftSection({ accounts }) {
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-gift", "data-lunara-scene": true, "data-lunara-bg": "lunara-gift-editorial-envelope-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-gift", choreo: "crown" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-gift-ribbon", "aria-hidden": "true" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-gift-shell" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-gift-intro", "data-lunara-reveal": "left" }, /* @__PURE__ */ import_react2.default.createElement(SectionHeading, { eyebrow: "Tanda kasih", title: "Wedding Gift", reveal: false }), /* @__PURE__ */ import_react2.default.createElement("p", { className: "lunara-gift-lead" }, "Doa restu Anda adalah hadiah terindah. Bagi yang ingin mengirimkan tanda kasih, silakan melalui rekening berikut."), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-gift-orbit", "aria-hidden": "true" }, /* @__PURE__ */ import_react2.default.createElement("i", null), /* @__PURE__ */ import_react2.default.createElement("span", null, "\u2726"), /* @__PURE__ */ import_react2.default.createElement("b", null))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-gift-content", "data-lunara-reveal": "right" }, accounts.length ? /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-bank-picker", "data-lunara-bank-picker": true }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-bank-picker-title" }, "Pilih bank / e-wallet"), /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-bank-trigger", type: "button", "data-lunara-bank-trigger": true, "aria-haspopup": "listbox", "aria-expanded": "false" }, /* @__PURE__ */ import_react2.default.createElement("strong", { "data-lunara-bank-label": true }, accounts[0].provider, accounts[0].label ? ` \u2014 ${accounts[0].label}` : ""), /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-bank-chevron", "aria-hidden": "true" })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-bank-options", role: "listbox", "data-lunara-bank-options": true }, accounts.map((account, index) => /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-bank-option", type: "button", role: "option", "aria-selected": index === 0 ? "true" : "false", "data-lunara-bank-option": index, key: account.id || index }, /* @__PURE__ */ import_react2.default.createElement("span", null, /* @__PURE__ */ import_react2.default.createElement("strong", null, account.provider), account.label && /* @__PURE__ */ import_react2.default.createElement("small", null, account.label)), /* @__PURE__ */ import_react2.default.createElement("i", { "aria-hidden": "true" }))))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-bank-stack" }, accounts.map((account, index) => /* @__PURE__ */ import_react2.default.createElement("article", { className: "lunara-bank-card", "data-lunara-bank-card": index, hidden: index > 0, key: account.id || index }, /* @__PURE__ */ import_react2.default.createElement("small", null, account.provider), /* @__PURE__ */ import_react2.default.createElement("strong", { "data-account-number": true }, account.account_number), /* @__PURE__ */ import_react2.default.createElement("p", null, "a.n. ", account.account_name), account.label && /* @__PURE__ */ import_react2.default.createElement("em", null, account.label), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", "data-copy-account": true }, /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-copy" }), " Salin Nomor"))))) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-empty" }, "Informasi amplop digital belum ditambahkan."))));
}
function RsvpSection({ invitation: i, guestName, greetings, preview }) {
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "lunara-section lunara-rsvp", id: "rsvp", "data-lunara-scene": true, "data-lunara-bg": "lunara-rsvp-editorial-response-v1" }, /* @__PURE__ */ import_react2.default.createElement(SceneTransition, null), /* @__PURE__ */ import_react2.default.createElement(MotionGarden, { className: "section-garden garden-rsvp", choreo: "embrace" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-rsvp-shell", "data-lunara-reveal": "tilt" }, /* @__PURE__ */ import_react2.default.createElement(SectionHeading, { eyebrow: "Ucapan & konfirmasi", title: "Kehadiran Anda", reveal: false }), preview && /* @__PURE__ */ import_react2.default.createElement("p", { className: "preview-form-badge" }, "Mode preview \u2014 form tidak mengirim data"), /* @__PURE__ */ import_react2.default.createElement("form", { className: "greeting-form lunara-form", ...preview ? { "data-preview-form": "" } : { "data-greeting-form": "" } }, /* @__PURE__ */ import_react2.default.createElement("input", { type: "hidden", name: "slug", value: i.slug || "" }), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-form-split" }, /* @__PURE__ */ import_react2.default.createElement("label", null, /* @__PURE__ */ import_react2.default.createElement("span", null, "Nama"), /* @__PURE__ */ import_react2.default.createElement("input", { name: "guest_name", maxLength: "120", required: true, defaultValue: guestName !== "Bapak/Ibu/Saudara/i" ? guestName : "", placeholder: "Nama Anda" })), /* @__PURE__ */ import_react2.default.createElement(FormPicker, { label: "Kehadiran", name: "attendance_status", defaultValue: "", placeholder: "Pilih kehadiran", options: [["attending", "Hadir"], ["not_attending", "Tidak Hadir"], ["unsure", "Masih Ragu"]] })), /* @__PURE__ */ import_react2.default.createElement("label", null, /* @__PURE__ */ import_react2.default.createElement("span", null, "Ucapan & doa"), /* @__PURE__ */ import_react2.default.createElement("textarea", { name: "message", maxLength: "500", required: true, placeholder: "Tuliskan doa hangat..." }), /* @__PURE__ */ import_react2.default.createElement("small", null, /* @__PURE__ */ import_react2.default.createElement("span", { "data-message-count": true }, "0"), "/500")), /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-button", type: "submit" }, "Kirim Ucapan ", /* @__PURE__ */ import_react2.default.createElement(AzureIcon, { name: "azure-arrow" })), /* @__PURE__ */ import_react2.default.createElement("p", { className: "form-feedback", "data-form-feedback": true })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "greeting-list lunara-wishes", "data-greeting-list": true }, greetings.length ? greetings.map((greeting) => /* @__PURE__ */ import_react2.default.createElement("article", { className: "greeting-item", key: greeting.id }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "greeting-head" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, greeting.guest_name), /* @__PURE__ */ import_react2.default.createElement("small", null, attendance(greeting.attendance_status))), /* @__PURE__ */ import_react2.default.createElement("p", null, greeting.message))) : /* @__PURE__ */ import_react2.default.createElement("div", { className: "greeting-empty", "data-empty-greeting": true }, "Belum ada ucapan. Jadilah yang pertama mengirimkan doa hangat."))));
}
function AzureIcon({ name }) {
  return /* @__PURE__ */ import_react2.default.createElement("svg", null, /* @__PURE__ */ import_react2.default.createElement("use", { href: `#${name}` }));
}
function FormPicker({ label, name, options, defaultValue = "", placeholder = "Pilih" }) {
  const initial = options.find(([value]) => value === defaultValue)?.[1] || placeholder;
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-field-picker", "data-lunara-select": true }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "lunara-field-label" }, label), /* @__PURE__ */ import_react2.default.createElement("input", { type: "hidden", name, defaultValue, "data-lunara-select-input": true }), /* @__PURE__ */ import_react2.default.createElement("button", { className: "lunara-select-trigger", type: "button", "data-lunara-select-trigger": true, "aria-haspopup": "listbox", "aria-expanded": "false" }, /* @__PURE__ */ import_react2.default.createElement("strong", { "data-lunara-select-label": true }, initial), /* @__PURE__ */ import_react2.default.createElement("i", { "aria-hidden": "true" })), /* @__PURE__ */ import_react2.default.createElement("div", { className: "lunara-select-options", role: "listbox" }, options.map(([value, text]) => /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", role: "option", "aria-selected": value === defaultValue ? "true" : "false", "data-lunara-select-option": value, key: value }, /* @__PURE__ */ import_react2.default.createElement("span", null, text), /* @__PURE__ */ import_react2.default.createElement("i", { "aria-hidden": "true" })))));
}
function AzureSymbols() {
  return /* @__PURE__ */ import_react2.default.createElement("svg", { className: "lunara-symbols" }, /* @__PURE__ */ import_react2.default.createElement("defs", null, /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-arrow", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M5 12h13m-5-5 5 5-5 5" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-map", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M12 21s6-5.4 6-12A6 6 0 0 0 6 9c0 6.6 6 12 6 12Z" }), /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "12", cy: "9", r: "2" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-copy", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("rect", { x: "8", y: "8", width: "11", height: "11", rx: "2" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-music", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M9 18V6l10-2v12M9 10l10-2" }), /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "6", cy: "18", r: "3" }), /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "16", cy: "16", r: "3" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-close", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "M18 6 6 18M6 6l12 12" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-chevron-left", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "m15 18-6-6 6-6" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-chevron-right", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("path", { d: "m9 18 6-6-6-6" })), /* @__PURE__ */ import_react2.default.createElement("symbol", { id: "azure-zoom", viewBox: "0 0 24 24" }, /* @__PURE__ */ import_react2.default.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ import_react2.default.createElement("path", { d: "m21 21-4.35-4.35M11 8v6M8 11h6" }))));
}
