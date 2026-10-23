// Génération du formulaire d'un module à partir de sa description (modules.js). Aucun innerHTML.
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k in el && k !== "list") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c);
  return el;
}

const toHex = (n) => "#" + Number(n || 0).toString(16).padStart(6, "0");
const fromHex = (s) => parseInt(s.slice(1), 16);

function checkList(items, selected, onChange) {
  const chosen = new Set((selected || []).map(String));
  const box = h("div", { class: "checks" });
  if (!items.length) box.append(h("span", { class: "muted" }, "Aucun élément disponible."));
  for (const it of items) {
    const cb = h("input", { type: "checkbox", checked: chosen.has(String(it.id)) });
    cb.addEventListener("change", () => {
      cb.checked ? chosen.add(String(it.id)) : chosen.delete(String(it.id));
      onChange([...chosen]);
    });
    box.append(h("label", {}, cb, " " + it.name));
  }
  return box;
}

function dropdown(items, value, onChange, empty) {
  const sel = h("select", {}, h("option", { value: "" }, empty), items.map((it) => h("option", { value: String(it.id) }, it.name)));
  sel.value = value == null ? "" : String(value);
  // valeur enregistrée mais disparue du serveur (salon supprimé) : on la garde visible
  if (value != null && sel.value !== String(value)) {
    sel.append(h("option", { value: String(value) }, "(élément introuvable)"));
    sel.value = String(value);
  }
  sel.addEventListener("change", () => onChange(sel.value || null));
  return sel;
}

/** Construit un champ ; `values` est modifié en place. Renvoie {el, setError}. */
export function buildField(field, values, guild) {
  const id = "f_" + field.key;
  const set = (v) => { values[field.key] = v; };
  const val = values[field.key];
  let input;
  switch (field.type) {
    case "bool":
      input = h("input", { type: "checkbox", id, checked: !!val, onchange: (e) => set(e.target.checked) });
      break;
    case "int":
      input = h("input", { type: "number", id, min: field.min, max: field.max, step: 1, value: val ?? "", oninput: (e) => set(e.target.value === "" ? null : Number(e.target.value)) });
      break;
    case "text":
      input = h("input", { type: "text", id, maxLength: field.max, value: val ?? "", oninput: (e) => set(e.target.value) });
      break;
    case "longtext":
      input = h("textarea", { id, maxLength: field.max, value: val ?? "", oninput: (e) => set(e.target.value) });
      break;
    case "color":
      input = h("input", { type: "color", id, value: toHex(val), oninput: (e) => set(fromHex(e.target.value)) });
      break;
    case "select":
      input = h("select", { id, onchange: (e) => set(e.target.value) }, field.options.map(([v, l]) => h("option", { value: v, selected: v === val }, l)));
      break;
    case "channel": {
      const kinds = field.kinds || ["text", "announcement"];
      input = dropdown(guild.channels.filter((c) => kinds.includes(c.type)), val, set, "— Aucun —");
      input.id = id;
      break;
    }
    case "role":
      input = dropdown(guild.roles, val, set, "— Aucun —");
      input.id = id;
      break;
    case "channels":
      input = checkList(guild.channels.filter((c) => ["text", "announcement"].includes(c.type)), val, set);
      break;
    case "roles":
      input = checkList(guild.roles, val, set);
      break;
    case "access": {
      const cur = { roles: [], users: [], ...(val || {}) };
      const upd = (roles) => set({ ...cur, roles });
      input = checkList(guild.roles, cur.roles, upd);
      break;
    }
    case "template": {
      const cur = { ...(val || {}) };
      const upd = (k) => (e) => { cur[k] = e.target.value; set({ ...cur }); };
      input = h("div", {},
        h("input", { type: "text", id, maxLength: 256, value: cur.title ?? "", placeholder: "Titre", oninput: upd("title") }),
        h("textarea", { maxLength: 2000, placeholder: "Texte", value: cur.text ?? "", oninput: upd("text") }));
      break;
    }
    default:
      input = h("span", { class: "muted" }, "Type de champ non pris en charge.");
  }
  const labelTag = ["roles", "channels", "access", "template"].includes(field.type) ? "span" : "label";
  const err = h("div", { class: "error", role: "alert", hidden: true });
  const el = h("div", { class: "field" },
    h(labelTag, labelTag === "label" ? { for: id } : { class: "lbl" }, field.label),
    input,
    field.hint && h("div", { class: "hint" }, field.hint),
    err);
  return {
    el,
    setError(msg) { err.textContent = msg || ""; err.hidden = !msg; },
  };
}
