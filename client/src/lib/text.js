// Lower-cases and drops macrons and other accents (and apostrophes), so a search for
// "otaki" finds "Ōtaki" and a search for "Ōtaki" finds "Otaki". People often type
// Te Reo names without the macrons, and both spellings are in use.
export function foldText (value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .trim()
}
