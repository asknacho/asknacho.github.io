// Sets --day on <html> from the sun's height over Barcelona:
// 1 = daylight (paper white), 0 = night (soft dark), blending through dawn and dusk.
// Preview a value with ?day=0.3 or a Barcelona time with ?bcn=21:30.
(function () {
  var LAT = 41.3874, LON = 2.1686, RAD = Math.PI / 180;

  function sunElevation(date) {
    var d = date.getTime() / 86400000 - 10957.5; // days since J2000
    var g = (357.529 + 0.98560028 * d) * RAD;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    var e = (23.439 - 0.00000036 * d) * RAD;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var gmst = 280.46061837 + 360.98564736629 * d;
    var ha = (gmst + LON) * RAD - ra;
    var lat = LAT * RAD;
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / RAD;
  }

  // Full night below -10° (deep twilight), full day above +8°.
  function dayFactor(elev) {
    var t = Math.min(1, Math.max(0, (elev + 10) / 18));
    return t * t * (3 - 2 * t);
  }

  // Convert a Barcelona wall-clock time (today) to a Date.
  function barcelonaTime(hhmm) {
    var m = /^(\d{1,2}):?(\d{2})?$/.exec(hhmm);
    if (!m) return null;
    var now = new Date();
    var parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Madrid', hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
    }).formatToParts(now).forEach(function (p) { parts[p.type] = +p.value; });
    var asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    var offset = asUTC - Math.floor(now.getTime() / 60000) * 60000; // Barcelona's UTC offset
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, +m[1], +(m[2] || 0)) - offset);
  }

  var params = new URLSearchParams(location.search);
  var forced = params.has('day') ? parseFloat(params.get('day')) : NaN;
  var at = params.has('bcn') ? barcelonaTime(params.get('bcn')) : null;

  function update() {
    var day = !isNaN(forced) ? Math.min(1, Math.max(0, forced)) : dayFactor(sunElevation(at || new Date()));
    document.documentElement.style.setProperty('--day', day.toFixed(3));
  }

  update();
  setInterval(update, 60000);
})();
