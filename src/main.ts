/// <reference types="@workadventure/iframe-api-typings" />

/* ============ LOGS ============ */
const L = {
  log: (...a: any[]) => console.log("[WA]", ...a),
  err: (...a: any[]) => console.error("[WA]", ...a),
};

/* ============ CONFIG ============ */
const MAP_URL = "/@/ynov-1733302243/ynov_adventure/new-map";
const ZONES: { id: string; label: string }[] = [
  { id: "#TPA-IA", label: "IA" },
  { id: "#TPAINFO", label: "Informatique" },
  { id: "#TPACYBER", label: "Cybersécurité" },
  { id: "#TPAARCHI", label: "Architecture" },
  { id: "#TPABIM", label: "Bâtiment Numérique" },
  { id: "#TPAAUDIO", label: "Audiovisuel" },
  { id: "#TPADIGITAL", label: "DIGITAL IA" },
  { id: "#TPA3D", label: "3D" },
  { id: "#TPAHUB", label: "Accueil" },
];

/* ============ RÉGLAGE SIMPLE ============ */
const PER_PAGE = 3;

/* ============ ACTION BAR HELPERS ============ */
function addActionButton(id: string, label: string, cb: () => void, style = true) {
  const ab: any = (WA.ui as any)?.actionBar;
  if (!ab?.addButton) { L.err("actionBar indisponible"); return false; }
  try { ab.removeButton?.(id); } catch {}
  try {
    const base: any = { id, label, callback: cb, clickCallback: cb };
    if (style) { base.bgColor = "#2ea7ff"; base.isGradient = true; }
    ab.addButton(base);
    return true;
  } catch (e) {
    try { ab.addButton({ id, label, callback: cb, clickCallback: cb }); return true; }
    catch (e2) { L.err("addButton error:", e2); return false; }
  }
}
function removeActionButton(id: string) {
  try { (WA.ui as any)?.actionBar?.removeButton?.(id); } catch {}
}

/* ============ ÉTAT ============ */
const MAIN_TP_BTN_ID = "teleport-btn";
let tpOpen = false;
let tpPage = 0;
let tpIds: string[] = [];

/* ============ INIT ============ */
WA.onInit().then(() => {
  // Ajout du bouton principal
  let tries = 0; const max = 20;
  const tryAdd = () => {
    tries++;
    const ok = addActionButton(MAIN_TP_BTN_ID, "Téléportation", openTeleportMenu, true);
    if (ok) { L.log("Bouton Téléportation OK"); return; }
    if (tries < max) setTimeout(tryAdd, 200);
    else L.err("Impossible d’ajouter le bouton Téléportation (action bar).");
  };
  tryAdd();

  // Menu “Paramètres” (optionnel)
  try {
    WA.ui.registerMenuCommand?.("Téléportation", openTeleportMenu);
    ZONES.forEach(z =>
      WA.ui.registerMenuCommand?.(z.label, () => {
        try { WA.nav.goToRoom(MAP_URL + z.id); } catch (e) { L.err("goToRoom error:", e); }
      })
    );
  } catch (e) {
    L.log("registerMenuCommand non disponible — pas bloquant.");
  }

  // Open the form after few seconds
  setTimeout(() => {
    openInitForm();
  }, 5000);
}).catch(e => L.err("onInit error:", e));

/* ============ TÉLÉPORTATION PAGINÉE ============ */
function openTeleportMenu() {
  if (tpOpen) return;
  tpOpen = true;
  removeActionButton(MAIN_TP_BTN_ID);
  tpPage = 0;
  drawTpPage();
}

function closeTeleportMenu() {
  clearTpButtons();
  tpOpen = false;
  addActionButton(MAIN_TP_BTN_ID, "Téléportation", openTeleportMenu, true);
}

function drawTpPage() {
  clearTpButtons();

  const total = Math.max(1, Math.ceil(ZONES.length / PER_PAGE));
  tpPage = Math.max(0, Math.min(tpPage, total - 1));

  const start = tpPage * PER_PAGE;
  const slice = ZONES.slice(start, start + PER_PAGE);

  if (tpPage > 0) addTpBtn("tp-prev", "◀", () => { tpPage--; drawTpPage(); });
  slice.forEach((z, i) => addTpBtn(`tp-${start + i}`, z.label, () => {
    try { WA.nav.goToRoom(MAP_URL + z.id); } catch (e) { L.err("goToRoom error:", e); }
    closeTeleportMenu();
  }));
  if (tpPage < total - 1) addTpBtn("tp-next", "▶", () => { tpPage++; drawTpPage(); });

  addTpBtn("tp-close", "✖", closeTeleportMenu);
}

function addTpBtn(id: string, label: string, cb: () => void) {
  if (addActionButton(id, label, cb, false)) tpIds.push(id);
}
function clearTpButtons() {
  tpIds.forEach(id => removeActionButton(id));
  tpIds = [];
}

function openInitForm(){
  // Check if the form is already done
  const formDone = WA.player.state.hasVariable("ynov_adventure_form_done");
  if (formDone) {
    L.log("Form already done");
    return;
  }
  
  L.log("Form opened");

  /// Init the variables form variables
  WA.player.state.saveVariable("ynov_adventure_form_done", false);

  // Disable user control
  WA.controls.disablePlayerControls();

  // Open the form
  // @ts-ignore: UI API is not typed
  WA.ui.modal.openModal({
    title: "Formulaire de présentation",
    allowApi: true,
    position: "center",
    allow: null,
    src: "https://blocksurvey.io/xT1hdkDrQ7WQWPssxz04kA?v=o",
    allowFullScreen: true,
    // @ts-ignore: UI API is not typed
    closable: false,
  }, ()=> {
    L.log("Form closed");
    WA.controls.restorePlayerControls();
  });
}

/* ✅ Pour le mode isolatedModules */
export {};
