export function applyFormatting(text: string, element: HTMLElement): string {
    // Check for italic formatting (either through tags or CSS)
    const hasItalic =
        element.tagName.toLowerCase() === 'i' ||
        element.tagName.toLowerCase() === 'em' ||
        element.style.fontStyle === 'italic';

    // Check for bold formatting (either through tags or CSS font-weight)
    const hasBold =
        element.tagName.toLowerCase() === 'b' ||
        element.tagName.toLowerCase() === 'strong' ||
        parseInt(element.style.fontWeight, 10) >= 600;

    // Apply markdown formatting in specific order
    let formatted = text;
    if (hasItalic) formatted = `*${formatted}*`; // Wrap in single asterisks for italic
    if (hasBold) formatted = `**${formatted}**`; // Wrap in double asterisks for bold
    return formatted;
}
