/**
 * Le scan de codes-barres n'a de sens qu'avec une caméra qu'on peut approcher
 * d'un emballage. Un ordinateur de bureau, même équipé d'une webcam fixe, ne
 * s'y prête pas : le bouton n'y est donc pas proposé.
 *
 * Le pointeur grossier distingue les téléphones et tablettes des ordinateurs
 * bien mieux que la chaîne d'agent utilisateur, qui se falsifie et se périme.
 */
export function canScanBarcodes(): boolean {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false
  return window.matchMedia('(pointer: coarse)').matches
}
