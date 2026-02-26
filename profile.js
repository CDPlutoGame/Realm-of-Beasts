// profile.js

export let meta = {
  gold: 0,
  potions: 0,
  maxHpBase: 30,
  attackPower: 5,
  maxHpPrice: 100,
  attackPowerPrice: 100,
  bossesDefeated: 0,
  autoSpinStage: 0,
  autoAttackStage: 0,
  prestigeLevel: 0
};

export async function loadMeta() {
  if (!window.auth || !window.db) return;

  const user = window.auth.currentUser;
  if (!user) return;

  const snap = await window.firebaseGet(
    window.firebaseRef(window.db, "users/" + user.uid + "/meta")
  );

  if (snap.exists()) {
    meta = { ...DEFAULT_META, ...snap.val() };
  } else {
    meta = { ...DEFAULT_META };
    await saveMeta();
  }

  return meta;
}

export async function saveMeta() {
  if (!window.auth || !window.db) return;

  const user = window.auth.currentUser;
  if (!user) return;

  await window.firebaseSet(
    window.firebaseRef(window.db, "users/" + user.uid + "/meta"),
    meta
  );
}
