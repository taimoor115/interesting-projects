function toBase62(num, length = 7) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
  
    if (num === 0) result = "0";
  
    while (num > 0) {
      const remainder = num % 62;
      result = chars[remainder] + result; // prepend
      num = Math.floor(num / 62);
    }
  
    // ensure always fixed length (pad with leading '0's)
    if (result.length < length) {
      result = result.padStart(length, "0");
    }
  
    // if somehow result is longer than desired length → keep last `length` chars
    if (result.length > length) {
      result = result.slice(-length);
    }
  
    return result;
  }
  
  module.exports = { toBase62 };
  