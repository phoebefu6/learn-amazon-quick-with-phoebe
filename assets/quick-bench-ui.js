/* quick-bench-ui.js - wires the build-or-buy bench on session 3. Engine: quick-bench.js. */
(function () {
  "use strict";
  var B = window.QUICK_BENCH;
  var root = document.getElementById("qb-bench");
  if (!B || !root) return;

  var FIELDS = ["ent", "pro", "ess", "accounts", "hoursPerUser", "indexGB",
    "fixedRun", "costPerQ", "qPerUser", "agentQ", "fte", "fteCost"];
  var NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function read() {
    var s = {};
    FIELDS.forEach(function (f) { var v = parseFloat($("qb-" + f).value); s[f] = isFinite(v) && v > 0 ? v : 0; });
    return s;
  }
  function write(s) { FIELDS.forEach(function (f) { $("qb-" + f).value = s[f]; }); }

  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function drawChart(s, cross) {
    var host = $("qb-chart");
    host.innerHTML = "";
    var users = s.ent + s.pro + s.ess;
    var maxU = Math.max(2000, Math.ceil((Math.max(users, cross.users || 0) * 1.25) / 500) * 500);
    var W = 880, H = 320, L = 70, R = 840, T = 40, Bm = 250, steps = 40, pts = [];
    for (var i = 0; i <= steps; i++) {
      var u = Math.max(1, maxU * i / steps), sc = B.scaled(s, u);
      pts.push({ u: u, q: B.quickCost(sc).total, b: B.inhouseCost(sc).total });
    }
    var maxY = 0;
    pts.forEach(function (p) { maxY = Math.max(maxY, p.q, p.b); });
    maxY = Math.ceil(maxY / 10000) * 10000 || 10000;
    var x = function (u) { return L + (R - L) * u / maxU; };
    var y = function (v) { return Bm - (Bm - T) * v / maxY; };
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Monthly cost against head count for Quick and the in-house platform, at the current tier mix" });
    svg.appendChild(svgEl("text", { x: 20, y: 22, style: "font:800 12px Inter,sans-serif;fill:#2B1B27" },
      "MONTHLY COST AS HEAD COUNT GROWS (SAME TIER MIX)"));
    for (var g = 0; g <= 4; g++) {
      var gv = maxY * g / 4;
      svg.appendChild(svgEl("line", { x1: L, x2: R, y1: y(gv), y2: y(gv), stroke: "#F0E4EC", "stroke-width": 1 }));
      svg.appendChild(svgEl("text", { x: L - 8, y: y(gv) + 4, "text-anchor": "end",
        style: "font:400 11px Inter,sans-serif;fill:#6B5766" }, money(gv)));
    }
    for (var t = 0; t <= 4; t++) {
      var tu = maxU * t / 4;
      svg.appendChild(svgEl("text", { x: x(tu), y: Bm + 18, "text-anchor": "middle",
        style: "font:400 11px Inter,sans-serif;fill:#6B5766" }, Math.round(tu).toLocaleString("en-US")));
    }
    svg.appendChild(svgEl("text", { x: (L + R) / 2, y: Bm + 36, "text-anchor": "middle",
      style: "font:600 11px Inter,sans-serif;fill:#6B5766" }, "people with a seat"));
    function line(key, color) {
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + x(p.u).toFixed(1) + " " + y(p[key]).toFixed(1); }).join(" ");
      svg.appendChild(svgEl("path", { d: d, fill: "none", stroke: color, "stroke-width": 3, "stroke-linecap": "round" }));
    }
    line("b", "#B0500E");
    line("q", "#A84E92");
    if (cross.users && cross.users <= maxU) {
      svg.appendChild(svgEl("line", { x1: x(cross.users), x2: x(cross.users), y1: T, y2: Bm,
        stroke: "#5E2552", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
      var lx = x(cross.users), right = lx < (L + R) / 2;
      svg.appendChild(svgEl("text", { x: right ? lx + 6 : lx - 6, y: T + 12, "text-anchor": right ? "start" : "end",
        style: "font:700 11px Inter,sans-serif;fill:#5E2552" }, "lines cross at " + cross.users.toLocaleString("en-US")));
    }
    svg.appendChild(svgEl("circle", { cx: x(users), cy: y(B.quickCost(s).total), r: 5, fill: "#A84E92" }));
    svg.appendChild(svgEl("circle", { cx: x(users), cy: y(B.inhouseCost(s).total), r: 5, fill: "#B0500E" }));
    svg.appendChild(svgEl("rect", { x: 560, y: 276, width: 14, height: 4, fill: "#A84E92" }));
    svg.appendChild(svgEl("text", { x: 580, y: 282, style: "font:600 11px Inter,sans-serif;fill:#2B1B27" }, "Quick"));
    svg.appendChild(svgEl("rect", { x: 650, y: 276, width: 14, height: 4, fill: "#B0500E" }));
    svg.appendChild(svgEl("text", { x: 670, y: 282, style: "font:600 11px Inter,sans-serif;fill:#2B1B27" }, "In-house"));
    svg.appendChild(svgEl("text", { x: 20, y: 312, style: "font:400 11px Inter,sans-serif;fill:#6B5766" },
      "Dots mark today's head count. Quick list prices read 26 Nov 2026; in-house inputs are yours."));
    host.appendChild(svg);
  }

  function runCost() {
    var s = read(), q = B.quickCost(s), b = B.inhouseCost(s), c = B.crossover(s, 20000);
    $("qb-quick").textContent = money(q.total);
    $("qb-quick-parts").textContent = "seats " + money(q.seats) + " · account fee " + money(q.fee) +
      " · extra hours " + money(q.hours) + " · extra storage " + money(q.storage);
    $("qb-inhouse").textContent = money(b.total);
    $("qb-inhouse-parts").textContent = "run " + money(b.run) + " · usage " + money(b.usage) + " · team " + money(b.team);
    var users = s.ent + s.pro + s.ess, diff = b.total - q.total;
    var msg = "At " + users.toLocaleString("en-US") + " people, " +
      (diff >= 0 ? "Quick costs " + money(diff) + " a month less" : "Quick costs " + money(-diff) + " a month more") +
      " (" + money(Math.abs(diff) * 12) + " a year). ";
    msg += c.users ? "With this tier mix the lines cross at " + c.users.toLocaleString("en-US") + " people; below that, " +
      (c.cheaperBelow === "quick" ? "Quick" : "in-house") + " is cheaper." : "The lines do not cross below 20,000 people.";
    $("qb-verdict").textContent = msg;
    var warn = $("qb-agent-warn");
    if (s.agentQ > 0) {
      warn.hidden = false;
      warn.textContent = s.agentQ.toLocaleString("en-US") + " agent queries a month are priced on the in-house side only. " +
        "Quick has no documented way for outside agents to call it, so these queries need the in-house platform whatever you buy.";
    } else { warn.hidden = true; }
    drawChart(s, c);
    return { quick: q.total, inhouse: b.total, crossover: c.users };
  }

  function runChecks() {
    var must = {};
    B.REQS.forEach(function (r) { must[r.id] = $("qb-req-" + r.id).checked; });
    var res = B.checklist($("qb-region").value, must), ul = $("qb-res");
    ul.innerHTML = "";
    var label = { pass: "Meets", ent: "Enterprise only", partial: "Partly", fail: "Blocker", unknown: "Not stated" };
    res.rows.forEach(function (r) {
      var li = document.createElement("li"), v = document.createElement("span"), why = document.createElement("span");
      v.className = "qb-v " + r.verdict; v.textContent = label[r.verdict];
      why.className = "qb-why"; why.textContent = r.why;
      li.appendChild(v); li.appendChild(document.createTextNode(r.label)); li.appendChild(why);
      ul.appendChild(li);
    });
    $("qb-check-sum").textContent = res.rows.length === 0 ? "Tick at least one must-have." :
      res.blockers + " blocker" + (res.blockers === 1 ? "" : "s") + ", " + res.unknown + " not stated publicly, " +
      res.needsEnterprise + " that need Enterprise, out of " + res.rows.length + " must-haves in " + res.region.name + ".";
    return res;
  }

  function setRung(id) {
    var rung = B.LADDER.filter(function (r) { return r.id === id; })[0] || B.LADDER[0];
    write(rung.s);
    Array.prototype.forEach.call(root.querySelectorAll(".qb-rung"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-rung") === rung.id);
    });
    $("qb-rung-note").textContent = rung.note + " Constructed numbers.";
    return runCost();
  }

  /* build rung buttons, region list, checkboxes */
  var rungs = $("qb-rungs");
  B.LADDER.forEach(function (r) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "qb-rung"; b.setAttribute("data-rung", r.id); b.textContent = r.name;
    b.addEventListener("click", function () { setRung(r.id); });
    rungs.appendChild(b);
  });
  var sel = $("qb-region");
  B.REGIONS.forEach(function (r) {
    var o = document.createElement("option");
    o.value = r.id; o.textContent = r.name + " (" + r.id + ")" + (r.agentic ? "" : " - no agentic features");
    sel.appendChild(o);
  });
  var checks = $("qb-checks");
  B.REQS.forEach(function (r) {
    var lab = document.createElement("label"), cb = document.createElement("input");
    cb.type = "checkbox"; cb.id = "qb-req-" + r.id; cb.checked = true;
    cb.addEventListener("change", runChecks);
    lab.appendChild(cb); lab.appendChild(document.createTextNode(r.label));
    checks.appendChild(lab);
  });
  FIELDS.forEach(function (f) { $("qb-" + f).addEventListener("input", runCost); });
  sel.addEventListener("change", runChecks);

  setRung("base");
  runChecks();
  window.QB_BENCH_UI = { setRung: setRung, runCost: runCost, runChecks: runChecks };
})();
