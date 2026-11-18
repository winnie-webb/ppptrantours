// Writes places.json and tours.json into the work folder given as argv[2].
import fs from "fs";
import { PLACES } from "../../app/data/places.js";
import { TOURS } from "../../app/data/catalogue.js";

const dir = process.argv[2];
fs.writeFileSync(
  `${dir}/places.json`,
  JSON.stringify(
    PLACES.filter((p) => p.active !== false).map((p) => ({
      key: p.key, name: p.name, area: p.area, locality: p.locality ?? null, zone: p.zone, kind: p.kind,
    }))
  )
);
fs.writeFileSync(
  `${dir}/tours.json`,
  JSON.stringify(TOURS.map((t) => ({ id: t.id, title: t.title, region: t.region, kind: t.kind, combines: t.combines ?? null })))
);
