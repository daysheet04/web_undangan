(() => {
  "use strict";
  const l = document.getElementById("builderApp"),
        r = document.getElementById("inviteeList"),
        n = document.getElementById("inviteeEditDialog"),
        h = document.getElementById("inviteeEditForm");
  if (!l || !r || !n || !h) return;

  const f = l.dataset.token || "",
        I = l.dataset.csrf || "",
        v = document.getElementById("inviteeEditId"),
        m = document.getElementById("inviteeEditName"),
        b = document.getElementById("inviteeEditPhone"),
        y = document.getElementById("inviteeEditSalutation"),
        c = document.getElementById("saveInviteeEdit");

  const E = t => {
    let e = String(t || "").replace(/\D/g, "");
    return e ? (e.startsWith("6208") ? `628${e.slice(4)}` : e.startsWith("08") ? `628${e.slice(2)}` : e.startsWith("8") ? `628${e.slice(1)}` : e.startsWith("0") && (e = `62${e.slice(1)}`), e) : "";
  };

  const k = t => {
    const e = E(t);
    return e.startsWith("628") ? `0${e.slice(2)}` : e;
  };

  const $ = () => {
    const t = document.getElementById("invitationForm"),
          e = t?.elements.groom_nickname?.value?.trim() || t?.elements.groom_full_name?.value?.trim() || "",
          a = t?.elements.bride_nickname?.value?.trim() || t?.elements.bride_full_name?.value?.trim() || "";
    return e && a ? `${e} & ${a}` : e || a || "Kedua Mempelai";
  };

  const C = t => {
    const e = document.getElementById("invitationForm")?.elements.slug?.value?.trim() || "",
          a = String(l.dataset.appUrl || window.location.origin).replace(/\/$/, "");
    return e ? `${a}/${e}?to=${encodeURIComponent(t)}` : "";
  };

  const U = (t, e, i) => {
    const o = t.toLowerCase().startsWith(e.toLowerCase()) ? t : `${e} ${t}`,
          s = $();
    return `💌 *WEDDING INVITATION*\n💍 *${s}* 💍\n──────────────────────────\n\nKepada Yth.\n*${o}*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk bersama-sama merayakan momen istimewa dan hari bahagia pernikahan kami.\n\n🔗 *Buka Tautan Undangan Digital:*\n${i}\n\nMerupakan suatu kehormatan dan kebahagiaan yang mendalam bagi kami sekeluarga apabila Anda berkenan hadir serta memberikan doa restu untuk mengawali lembaran baru ini.\n\nTerima kasih atas segala perhatian, doa tulus, dan kasih hangat yang senantiasa menyertai. Sampai jumpa di hari bahagia kami! 💐🙏✨\n\n──────────────────────────\n_Hormat kami yang berbahagia,_\n*${s}*`;
  };

  const B = (t, e, a, i) => {
    const d = U(t, e, i);
    return a ? `https://wa.me/${a}?text=${encodeURIComponent(d)}` : `https://wa.me/?text=${encodeURIComponent(d)}`;
  };

  const g = t => {
    const e = t.querySelector(".invitee-link");
    if (!e) return;
    if (!e.querySelector("[data-copy-message]")) {
      const a = document.createElement("button");
      a.type = "button";
      a.className = "btn-copy-msg";
      a.dataset.copyMessage = "";
      a.textContent = "📋 Salin Pesan";
      a.title = "Salin seluruh teks pesan undangan lengkap";
      const i = e.querySelector(".btn-direct-wa") || e.querySelector("[data-edit-invitee]");
      e.insertBefore(a, i || null);
    }
    if (!e.querySelector("[data-edit-invitee]")) {
      const a = document.createElement("button");
      a.type = "button";
      a.dataset.editInvitee = "";
      a.textContent = "Edit";
      const i = e.querySelector("[data-delete-invitee]");
      e.insertBefore(a, i || null);
    }
  };

  r.querySelectorAll(".invitee-row").forEach(g);
  new MutationObserver(t => {
    t.forEach(e => e.addedNodes.forEach(a => {
      a instanceof HTMLElement && (a.matches(".invitee-row") && g(a), a.querySelectorAll?.(".invitee-row").forEach(g));
    }));
  }).observe(r, { childList: !0, subtree: !0 });

  const p = () => {
    typeof n.close == "function" && n.open ? n.close() : n.removeAttribute("open");
  };

  const S = t => {
    v.value = t.dataset.guestId || "";
    m.value = t.dataset.guestName || "";
    b.value = k(t.dataset.guestPhone || "");
    y.value = t.dataset.guestSalutation || "Bapak/Ibu/Saudara/i";
    typeof n.showModal == "function" ? n.showModal() : n.setAttribute("open", "");
    window.setTimeout(() => m.focus(), 30);
  };

  r.addEventListener("click", async t => {
    const copyMsg = t.target.closest("[data-copy-message]");
    if (copyMsg) {
      t.preventDefault();
      t.stopImmediatePropagation();
      const row = copyMsg.closest(".invitee-row");
      if (!row) return;
      const name = row.dataset.guestName || "",
            salut = row.dataset.guestSalutation || "Bapak/Ibu/Saudara/i",
            link = C(name),
            msg = U(name, salut, link);
      try {
        await navigator.clipboard.writeText(msg);
        window.showToast?.("Pesan undangan berhasil disalin.");
      } catch {
        window.prompt("Salin pesan undangan:", msg);
      }
      return;
    }

    const editBtn = t.target.closest("[data-edit-invitee]");
    if (editBtn) {
      t.preventDefault();
      t.stopImmediatePropagation();
      const a = editBtn.closest(".invitee-row");
      a && S(a);
    }
  }, !0);

  n.querySelectorAll("[data-close-invitee-edit]").forEach(t => t.addEventListener("click", p));
  n.addEventListener("click", t => { t.target === n && p(); });

  const _ = t => {
    const e = r.querySelector(`[data-guest-id="${t.id}"]`);
    if (!e) return;
    const a = E(t.phone_number || "");
    e.dataset.guestName = t.guest_name;
    e.dataset.guestPhone = a;
    e.dataset.guestSalutation = t.salutation || "";
    const i = e.querySelector(".invitee-info > strong");
    i && (i.textContent = t.guest_name);
    const o = e.querySelector(".invitee-row-meta");
    if (o) {
      o.replaceChildren();
      if (t.salutation) {
        const u = document.createElement("span");
        u.className = "invitee-salut-badge";
        u.textContent = t.salutation;
        o.appendChild(u);
      }
      if (a) {
        const u = document.createElement("span");
        u.className = "invitee-phone-badge";
        u.textContent = `📱 ${k(a)}`;
        o.appendChild(u);
      }
    }
    const s = C(t.guest_name);
    const d = e.querySelector(".invitee-link input[readonly]");
    d && s && (d.value = s);
    const w = e.querySelector(".btn-direct-wa");
    w && (w.href = B(t.guest_name, t.salutation || "Bapak/Ibu/Saudara/i", a, s));
    document.getElementById("inviteeSearch")?.dispatchEvent(new Event("input", { bubbles: !0 }));
  };

  h.addEventListener("submit", async t => {
    t.preventDefault();
    const e = m.value.trim();
    if (!e) {
      window.showToast?.("Nama tamu wajib diisi.", "error");
      m.focus();
      return;
    }
    c.disabled = !0;
    c.textContent = "Menyimpan...";
    try {
      const a = await fetch(`/api/invitation/invitees/${encodeURIComponent(v.value)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _csrf: I, editor_token: f, guest_name: e, salutation: y.value, phone: b.value })
      });
      const i = await a.json();
      if (!a.ok || !i.ok) throw new Error(i.message || "Data tamu gagal diperbarui.");
      _(i.guest);
      p();
      window.showToast?.(i.message || "Data tamu berhasil diperbarui.");
    } catch (a) {
      window.showToast?.(a.message || "Data tamu gagal diperbarui.", "error");
    } finally {
      c.disabled = !1;
      c.textContent = "Simpan perubahan";
    }
  });
})();
