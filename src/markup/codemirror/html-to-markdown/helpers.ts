/** Helper class for handling text formatting conversions from HTML to Markdown */
export class FormattingHelper {
    /**
     * Converts HTML formatting elements to Markdown syntax
     * @param {string} text - The text content to be formatted
     * @param {HTMLElement} element - The HTML element containing formatting information
     * @returns {string} The text formatted with Markdown syntax
     */
    applyFormatting(text: string, element: HTMLElement): string {
        // Check for italic formatting (either through tags or CSS)
        const hasItalic = element.tagName.toLowerCase() === 'i' || 
                         element.tagName.toLowerCase() === 'em' || 
                         element.style.fontStyle === 'italic';
        
        // Check for bold formatting (either through tags or CSS font-weight)
        const hasBold = element.tagName.toLowerCase() === 'b' || 
                       element.tagName.toLowerCase() === 'strong' || 
                       parseInt(element.style.fontWeight, 10) >= 600;
        
        // Apply markdown formatting in specific order
        let formatted = text;
        if (hasItalic) formatted = `*${formatted}*`;  // Wrap in single asterisks for italic
        if (hasBold) formatted = `**${formatted}**`;  // Wrap in double asterisks for bold
        return formatted;
    }
} 