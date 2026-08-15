const results = JSON.parse(process.env.CI_JOB_RESULTS || "{}");
const failures = Object.entries(results).filter(([, result]) => result !== "success");

console.log(`[quality-gate] ${JSON.stringify(results)}`);
if (failures.length) {
  console.error(`[quality-gate] failed dependencies: ${failures.map(([name, result]) => `${name}=${result}`).join(", ")}`);
  process.exit(1);
}
console.log("[quality-gate] all required layers passed");
