/** First names, so a line of readers stays short. */
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** "Bia quer ler", "Bia e Caio querem ler", "Bia, Caio e mais 2 querem ler". */
export function friendsWantLabel(names: string[]): string {
  return `${namesLabel(names)} ${names.length === 1 ? "quer" : "querem"} ler`;
}

/** "Bia", "Bia e Rafa", "Bia, Rafa e mais 3": first names, two at most. */
export function namesLabel(names: string[]): string {
  const first = names.slice(0, 2).map(firstName);
  const rest = names.length - first.length;
  if (names.length === 1) return first[0]!;
  if (rest === 0) return `${first[0]} e ${first[1]}`;
  return `${first.join(", ")} e mais ${rest}`;
}
