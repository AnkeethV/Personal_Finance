export const evaluateMath = (expression) => {
  if (!expression) return '';
  try {
    // Replace any character that is not a digit, operator, or decimal
    const sanitized = expression.toString().replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) return expression;
    
    // Evaluate safely using Function
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    
    if (result === Infinity || Number.isNaN(result)) return expression;
    
    // Return rounded to 2 decimals or as is to prevent long floating point errors
    return (Math.round(result * 100) / 100).toString();
  } catch (err) {
    // If invalid (e.g. "5+"), just return the string
    return expression;
  }
};
