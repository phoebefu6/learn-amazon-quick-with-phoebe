/* quick-bench.js - build-or-buy bench for learn-amazon-quick-with-phoebe.
   Quick list prices from aws.amazon.com/quick/pricing (read 2026-11-26). Every in-house number
   and every preset is constructed for teaching (Oakmere Insurance). Re-check prices before use. */
(function (root) {
  "use strict";

  var PRICE = {
    seat: { ent: 40, pro: 20, ess: 3 },
    hours: { ent: 18, pro: 8, ess: 1 },        /* agent hours included per user per month */
    poolGB: { ent: 50, pro: 25, ess: 1 },      /* pooled index storage per user */
    accountFee: 250, hourOver: 3, gbOver: 5
  };

  /* Cross-Region inference type per Quick Region (docs regions page, 2026-11-26). */
  var REGIONS = [
    { id: "ap-southeast-1", name: "Singapore", agentic: true, cris: "global" },
    { id: "ap-south-1", name: "Mumbai", agentic: true, cris: "global" },
    { id: "sa-east-1", name: "Sao Paulo", agentic: true, cris: "global" },
    { id: "ap-southeast-2", name: "Sydney", agentic: true, cris: "country", pair: "Sydney and Melbourne" },
    { id: "ap-northeast-1", name: "Tokyo", agentic: true, cris: "country", pair: "Tokyo and Osaka" },
    { id: "us-east-1", name: "N. Virginia", agentic: true, cris: "country", pair: "US Regions" },
    { id: "us-west-2", name: "Oregon", agentic: true, cris: "country", pair: "US Regions" },
    { id: "eu-central-1", name: "Frankfurt", agentic: true, cris: "bloc" },
    { id: "eu-west-1", name: "Ireland", agentic: true, cris: "bloc" },
    { id: "eu-west-2", name: "London", agentic: true, cris: "bloc" },
    { id: "eu-west-3", name: "Paris", agentic: true, cris: "bloc" },
    { id: "ap-east-1", name: "Hong Kong", agentic: false, cris: "none" },
    { id: "ap-northeast-2", name: "Seoul", agentic: false, cris: "none" },
    { id: "ap-southeast-3", name: "Jakarta", agentic: false, cris: "none" }
  ];

  /* Each requirement against Quick. verdict: pass | ent (pass on Enterprise only) | partial | fail | unknown */
  var REQS = [
    { id: "acct", label: "Indexed data and embeddings stay in our own AWS account",
      verdict: "unknown", why: "AWS says stored data stays in the Region. No public page says whose account holds the index; per-GB index billing suggests AWS runs it." },
    { id: "region", label: "Prompts are processed only inside our country",
      verdict: "region", why: "Quick uses cross-Region inference and it cannot be switched off or logged." },
    { id: "lf", label: "Lake Formation PII tiers apply to every chat answer",
      verdict: "fail", why: "Per-user Lake Formation rules apply only to direct Athena queries with Identity Center propagation; not to SPICE or chat knowledge bases." },
    { id: "mcp", label: "Our AI agents can call the platform over MCP",
      verdict: "fail", why: "Quick is an MCP client only. It calls your MCP server; outside agents have no documented way to call Quick." },
    { id: "model", label: "We choose and pin the model",
      verdict: "fail", why: "Chat offers speed modes, not a model list. Only Automate custom agents can bring a Bedrock model." },
    { id: "cmk", label: "Our own KMS keys encrypt the data",
      verdict: "ent", why: "Customer-managed keys need Enterprise, must be set before any resource exists, and turn chat memory off." },
    { id: "vpc", label: "Private network path to our sources",
      verdict: "ent", why: "VPC connections and private MCP servers need Enterprise." },
    { id: "audit", label: "Audit log holds each answer with the text it retrieved",
      verdict: "fail", why: "CloudTrail has metadata only; chat logs are off by default and exclude retrieved text." },
    { id: "acl", label: "Source document permissions are honoured",
      verdict: "partial", why: "Only for S3, SharePoint, OneDrive, Google Drive and Confluence Cloud; permission changes sync every 24 hours." },
    { id: "train", label: "Vendor never trains models on our data",
      verdict: "pass", why: "AWS states Quick does not use customer data to train models, on any plan." },
    { id: "exit", label: "We can export everything if we leave",
      verdict: "partial", why: "Dashboards and datasets export as JSON or CloudFormation (no data). No export found for agents, flows or spaces." }
  ];

  function num(x) { x = Number(x); return isFinite(x) && x > 0 ? x : 0; }

  /* Quick monthly cost. s: {ent, pro, ess, accounts, hoursPerUser, indexGB} */
  function quickCost(s) {
    var ent = num(s.ent), pro = num(s.pro), ess = num(s.ess);
    var seats = ent * PRICE.seat.ent + pro * PRICE.seat.pro + ess * PRICE.seat.ess;
    var fee = Math.max(1, num(s.accounts)) * PRICE.accountFee;
    var h = num(s.hoursPerUser);
    var overHours = ent * Math.max(0, h - PRICE.hours.ent) + pro * Math.max(0, h - PRICE.hours.pro) +
      ess * Math.max(0, h - PRICE.hours.ess);
    var pool = ent * PRICE.poolGB.ent + pro * PRICE.poolGB.pro + ess * PRICE.poolGB.ess;
    var overGB = Math.max(0, num(s.indexGB) - pool);
    var hours = overHours * PRICE.hourOver, storage = overGB * PRICE.gbOver;
    return { seats: seats, fee: fee, hours: hours, storage: storage, overHours: overHours, overGB: overGB,
      total: seats + fee + hours + storage };
  }

  /* In-house monthly cost. s: {fixedRun, costPerQ, qPerUser, agentQ, fte, fteCost, ent, pro, ess} */
  function inhouseCost(s) {
    var users = num(s.ent) + num(s.pro) + num(s.ess);
    var run = num(s.fixedRun);
    var usage = (users * num(s.qPerUser) + num(s.agentQ)) * num(s.costPerQ);
    var team = num(s.fte) * num(s.fteCost);
    return { run: run, usage: usage, team: team, total: run + usage + team };
  }

  function scaled(s, users) {
    var u = num(s.ent) + num(s.pro) + num(s.ess);
    var k = u > 0 ? users / u : 0, o = {};
    for (var key in s) o[key] = s[key];
    o.ent = num(s.ent) * k; o.pro = num(s.pro) * k; o.ess = num(s.ess) * k;
    return o;
  }

  /* Smallest head count (same tier mix) at which Quick costs more than in-house, scanning 1..maxUsers. */
  function crossover(s, maxUsers) {
    maxUsers = maxUsers || 5000;
    var quickFirst = quickCost(scaled(s, 1)).total > inhouseCost(scaled(s, 1)).total;
    for (var n = 1; n <= maxUsers; n++) {
      var q = quickCost(scaled(s, n)).total, b = inhouseCost(scaled(s, n)).total;
      if ((q > b) !== quickFirst) return { users: n, cheaperBelow: quickFirst ? "in-house" : "quick" };
    }
    return { users: null, cheaperBelow: quickFirst ? "in-house" : "quick" };
  }

  function regionById(id) {
    for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i];
    return REGIONS[0];
  }

  /* Checklist result for the requirements the user marked must-have. */
  function checklist(regionId, must) {
    var r = regionById(regionId), out = [];
    REQS.forEach(function (q) {
      if (!must[q.id]) return;
      var v = q.verdict, why = q.why;
      if (q.id === "region") {
        if (!r.agentic) { v = "fail"; why = "Quick's agentic features are not offered in " + r.name + "."; }
        else if (r.cris === "global") { v = "fail"; why += " " + r.name + " uses Global routing: any commercial Region."; }
        else if (r.cris === "country") { v = "pass"; why = r.name + " routes within " + r.pair + ", inside one country. Not switchable, not logged."; }
        else { v = "fail"; why += " " + r.name + " routes within its European geography, which can cross national borders."; }
      }
      out.push({ id: q.id, label: q.label, verdict: v, why: why });
    });
    var blockers = out.filter(function (x) { return x.verdict === "fail"; }).length;
    var unknown = out.filter(function (x) { return x.verdict === "unknown"; }).length;
    var ent = out.filter(function (x) { return x.verdict === "ent"; }).length;
    return { region: r, rows: out, blockers: blockers, unknown: unknown, needsEnterprise: ent };
  }

  /* Constructed presets: Oakmere Insurance. */
  var LADDER = [
    { id: "base", name: "1 · Oakmere today", note: "250 staff: 30 builders on Enterprise, 220 on Professional.",
      s: { ent: 30, pro: 220, ess: 0, accounts: 1, hoursPerUser: 6, indexGB: 400,
           fixedRun: 3800, costPerQ: 0.03, qPerUser: 120, agentQ: 0, fte: 1.5, fteCost: 12000 } },
    { id: "allent", name: "2 · Controls force Enterprise", note: "Customer keys and private network are Enterprise features, so all 250 move up.",
      s: { ent: 250, pro: 0, ess: 0, accounts: 1, hoursPerUser: 6, indexGB: 400,
           fixedRun: 3800, costPerQ: 0.03, qPerUser: 120, agentQ: 0, fte: 1.5, fteCost: 12000 } },
    { id: "heavy", name: "3 · Heavy agent use", note: "Research and scheduled flows push use to 25 agent hours a person.",
      s: { ent: 250, pro: 0, ess: 0, accounts: 1, hoursPerUser: 25, indexGB: 400,
           fixedRun: 3800, costPerQ: 0.03, qPerUser: 400, agentQ: 0, fte: 1.5, fteCost: 12000 } },
    { id: "wide", name: "4 · Roll out to 1,500 readers", note: "Every claims handler gets chat; most ask a few questions a week.",
      s: { ent: 30, pro: 1470, ess: 0, accounts: 1, hoursPerUser: 3, indexGB: 400,
           fixedRun: 4600, costPerQ: 0.03, qPerUser: 20, agentQ: 0, fte: 2, fteCost: 12000 } },
    { id: "agents", name: "5 · Agents become the main users", note: "Claims agents query the platform 200,000 times a month over MCP. Quick cannot serve them at any price.",
      s: { ent: 30, pro: 220, ess: 0, accounts: 1, hoursPerUser: 6, indexGB: 400,
           fixedRun: 4600, costPerQ: 0.03, qPerUser: 120, agentQ: 200000, fte: 2, fteCost: 12000 } }
  ];

  var API = { PRICE: PRICE, REGIONS: REGIONS, REQS: REQS, LADDER: LADDER,
    quickCost: quickCost, inhouseCost: inhouseCost, crossover: crossover, checklist: checklist, scaled: scaled };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.QUICK_BENCH = API;
})(typeof window !== "undefined" ? window : this);
