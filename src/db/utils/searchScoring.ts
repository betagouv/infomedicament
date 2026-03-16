import { MatchReason } from "./search";

export function computeSortScore(
    query: string,
    groupName: string,
    composants: string,
    matchReasons: MatchReason[],
    baseSmlScore: number,
): number {
    const hasName = matchReasons.some((r) => r.type === "name");
    const hasSubstance = matchReasons.some((r) => r.type === "substance");
    const substanceLabel = matchReasons.find((r) => r.type === "substance")?.label ?? "";

    if (hasName && groupName.toLowerCase().startsWith(query.toLowerCase()))
        return 6 + baseSmlScore; // name starts with query
    if (hasName) return 4 + baseSmlScore; // name contains query
    if (hasSubstance && !composants.includes(",")) return 3 + baseSmlScore; // single substance
    // Check if matched substance is the first in the composants list (both from DB, same encoding)
    if (hasSubstance && composants.toLowerCase().startsWith(substanceLabel.toLowerCase()))
        return 2 + baseSmlScore; // composants starts with matched substance
    if (hasSubstance) return 1 + baseSmlScore; // substance matched elsewhere
    return baseSmlScore; // ATC / pathology
}