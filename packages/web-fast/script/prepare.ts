#!/usr/bin/env bun

import fs from "fs/promises";
import path from "path";

import { generate } from "models.dev";

import type { SiteData, SiteRow } from "../src/types.js";

const root = path.join(import.meta.dir, "..", "..");
const providersDir = path.join(root, "..", "providers");
const publicDir = path.join(import.meta.dir, "..", "public");
const dataDir = path.join(publicDir, "data");
const logosDir = path.join(publicDir, "logos");

function compactText(parts: Array<string | null | undefined>) {
  return parts
    .filter((part) => part !== undefined && part !== null && part !== "")
    .join(" ")
    .toLowerCase();
}

function createRows(providers: Awaited<ReturnType<typeof generate>>): SiteRow[] {
  const rows: SiteRow[] = [];

  for (const [providerId, provider] of Object.entries(providers)) {
    for (const [modelId, model] of Object.entries(provider.models)) {
      if (model.status === "alpha") continue;

      rows.push({
        providerName: provider.name,
        providerId,
        modelName: model.name,
        modelId,
        family: model.family ?? null,
        toolCall: model.tool_call,
        reasoning: model.reasoning,
        input: model.modalities.input,
        output: model.modalities.output,
        cost: model.cost
          ? {
              input: model.cost.input ?? null,
              output: model.cost.output ?? null,
              reasoning: model.cost.reasoning ?? null,
              cacheRead: model.cost.cache_read ?? null,
              cacheWrite: model.cost.cache_write ?? null,
              inputAudio: model.cost.input_audio ?? null,
              outputAudio: model.cost.output_audio ?? null,
            }
          : null,
        limit: {
          context: model.limit.context,
          input: model.limit.input ?? null,
          output: model.limit.output,
        },
        structuredOutput: model.structured_output ?? null,
        temperature: model.temperature ?? false,
        openWeights: model.open_weights,
        knowledge: model.knowledge ?? null,
        releaseDate: model.release_date,
        lastUpdated: model.last_updated,
        searchText: compactText([
          provider.name,
          providerId,
          model.name,
          modelId,
          model.family,
          model.tool_call ? "tool call" : null,
          model.reasoning ? "reasoning" : null,
          model.open_weights ? "open" : "closed",
          model.knowledge,
          model.release_date,
          model.last_updated,
          model.modalities.input.join(" "),
          model.modalities.output.join(" "),
        ]),
      });
    }
  }

  rows.sort((a, b) => {
    const providerCompare = a.providerName.localeCompare(b.providerName);
    if (providerCompare !== 0) return providerCompare;
    return a.modelName.localeCompare(b.modelName);
  });

  return rows;
}

await fs.mkdir(dataDir, { recursive: true });
await fs.mkdir(logosDir, { recursive: true });

const providers = await generate(providersDir);
const rows = createRows(providers);
const siteData: SiteData = {
  generatedAt: new Date().toISOString(),
  rowCount: rows.length,
  rows,
};

await Bun.write(path.join(dataDir, "site-data.json"), JSON.stringify(siteData));

await Bun.write(
  path.join(publicDir, "favicon.svg"),
  Bun.file(path.join(root, "web", "public", "favicon.svg")),
);
await Bun.write(
  path.join(publicDir, "social-share.png"),
  Bun.file(path.join(root, "web", "public", "social-share.png")),
);

const defaultLogoPath = path.join(providersDir, "logo.svg");
await Bun.write(path.join(logosDir, "default.svg"), Bun.file(defaultLogoPath));

for await (const logoPath of new Bun.Glob("*/logo.svg").scan({
  cwd: providersDir,
  absolute: true,
})) {
  const providerId = path.basename(path.dirname(logoPath));
  await Bun.write(path.join(logosDir, `${providerId}.svg`), Bun.file(logoPath));
}
