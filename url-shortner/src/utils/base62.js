function toBase62(deci) {
    var hash_str, s;
    s = "012345689abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    hash_str = "";
  
    while (deci > 0) {
      var b = parseInt(deci % 62);
      var a = s[b] ? s[b] : "";
      hash_str = hash_str + a;
      deci = parseInt(deci / 62);
      console.log("b", b, "a", a, "deci", deci);
    }
  
    return hash_str;
  }
  
  module.exports = {
      toBase62,
  };
  