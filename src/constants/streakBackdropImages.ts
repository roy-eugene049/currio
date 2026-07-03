/**
 * Curated Pexels photos — fire, flame, and warm motivation imagery.
 * @see https://www.pexels.com/license/
 */
function pexelsPhoto(id: number, width = 640, height = 900): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
}

export const STREAK_BACKDROP_IMAGES = [
  pexelsPhoto(207353), // bonfire at night
  pexelsPhoto(2668966), // roaring flames
  pexelsPhoto(1365425), // campfire in the woods
  pexelsPhoto(6990873), // close fire sparks
  pexelsPhoto(325185), // blazing orange fire
  pexelsPhoto(7005503), // torch flame
  pexelsPhoto(1543760), // sparklers — celebration energy
  pexelsPhoto(7991579), // warm flame texture
] as const;

export function streakBackdropForStreak(streak: number): string {
  const index = Math.abs(Math.floor(streak)) % STREAK_BACKDROP_IMAGES.length;
  return STREAK_BACKDROP_IMAGES[index]!;
}
