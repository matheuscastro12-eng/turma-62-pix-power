// Verifica estaticamente as migrations: nenhuma policy de SELECT em
// storage.objects para o bucket "comprovantes" pode continuar ativa sem
// restrição de admin depois de aplicadas todas as migrations.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

function activeStoragePolicies() {
  const policies = new Map();
  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    const re =
      /(CREATE|DROP)\s+POLICY\s+(?:IF\s+EXISTS\s+)?"([^"]+)"\s+ON\s+storage\.objects([\s\S]*?);/gi;
    for (const [, op, name, body] of sql.matchAll(re)) {
      if (op.toUpperCase() === "CREATE") policies.set(name, body);
      else policies.delete(name);
    }
  }
  return policies;
}

test("nenhuma leitura pública de comprovantes no storage", () => {
  for (const [name, body] of activeStoragePolicies()) {
    if (!/FOR\s+SELECT/i.test(body) || !/comprovantes/.test(body)) continue;
    assert.match(body, /TO\s+authenticated/i, `policy "${name}" vale para anon`);
    assert.match(body, /is_admin\(auth\.uid\(\)\)/, `policy "${name}" não exige admin`);
  }
});

test("policy pública antiga de comprovantes foi removida", () => {
  assert.ok(!activeStoragePolicies().has("Permitir visualização pública de comprovantes"));
});
