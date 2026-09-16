const STORAGE_KEY = "padron-electoral-registros";
const CSV_URL = "padron-electoral.csv?v=20260916-3";
const recordsBody = document.querySelector("#recordsBody");
const emptyState = document.querySelector("#emptyState");
const search = document.querySelector("#search");

let records = [];

async function loadRecords() {
  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("CSV not available");
    return parseCsvRecords(await response.text());
  } catch {
    // Continue with local data if the public CSV is not available.
  }

  try {
    const savedRecords = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (savedRecords.length) return repairLoadedRecords(savedRecords);
  } catch {
    return [];
  }

  return [];
}

function repairLoadedRecords(loadedRecords) {
  let changed = false;
  const repairedRecords = loadedRecords.map((record) => {
    const firstNames = fixNameText(record.firstNames || "");
    const lastNames = fixNameText(record.lastNames || "");
    const fullName = fixNameText(record.fullName || "");
    if (firstNames !== normalize(record.firstNames) || lastNames !== normalize(record.lastNames) || fullName !== normalize(record.fullName)) {
      changed = true;
      return { ...record, firstNames, lastNames, fullName };
    }
    return record;
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repairedRecords));
  }
  return repairedRecords;
}

function normalize(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function parseCsvRecords(csvText) {
  const rows = parseCsv(csvText, detectCsvDelimiter(csvText)).filter((row) => row.some((value) => normalize(value)));
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => normalize(header).toLowerCase());
  return rows.slice(1).map((row, index) => {
    const item = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] || ""]));
    const firstNames = item.nombres || item.nombre || "";
    const lastNames = item.apellidos || item.apellido || "";
    return {
      id: item.cedula || item.ci || String(index + 1),
      firstNames,
      lastNames,
      fullName: `${firstNames} ${lastNames}`.trim(),
      birthDate: item.fecha_nacimiento || item["fec nac"] || item.fecha || item.nacimiento || "",
      sex: normalize(item.sexo).toUpperCase().slice(0, 1),
      documentNumber: item.cedula || item.ci || "",
      pollingPlace: item.local,
      neighborhood: item.barrio_compania || "",
      tableNumber: item.mesa,
      orderNumber: item.orden,
    };
  });
}

function detectCsvDelimiter(csvText) {
  const firstLine = csvText.split(/\r\n|\n|\r/, 1)[0] || "";
  return (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
}

function parseCsv(csvText, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function fixNameText(value) {
  return normalize(value)
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ")
    .replace(/�/g, "ñ")
    .replace(/([A-Za-zÁÉÍÓÚÜáéíóúü])\s*[,\u201E]+\s*([A-Za-zÁÉÍÓÚÜáéíóúü])/g, (match, before, after) => {
      const letter = before === before.toUpperCase() && after === after.toUpperCase() ? "Ñ" : "ñ";
      return `${before}${letter}${after}`;
    });
}

function formatDate(value) {
  const text = normalize(value);
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return `${isoMatch[3].padStart(2, "0")}/${isoMatch[2].padStart(2, "0")}/${isoMatch[1]}`;

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[1].padStart(2, "0")}/${slashMatch[2].padStart(2, "0")}/${slashMatch[3]}`;

  return text;
}

function sexLabel(value) {
  return {
    F: "Femenino",
    M: "Masculino",
    O: "Otro",
  }[value] || "-";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

function getFilteredRecords() {
  const term = normalize(search.value).toLowerCase();
  return records.filter((record) => {
    const text = [
      record.firstNames,
      fixNameText(record.firstNames),
      record.lastNames,
      fixNameText(record.lastNames),
      record.fullName,
      fixNameText(record.fullName),
      record.birthDate,
      record.sex,
      record.documentNumber,
      record.pollingPlace,
      record.tableNumber,
      record.orderNumber,
    ].join(" ").toLowerCase();
    return text.includes(term);
  });
}

function renderTable() {
  const filtered = getFilteredRecords();
  emptyState.hidden = filtered.length > 0;
  recordsBody.innerHTML = filtered.map((record) => `
    <tr>
      <td data-label="Nombres">${escapeHtml(fixNameText(record.firstNames || record.fullName || ""))}</td>
      <td data-label="Apellidos">${escapeHtml(fixNameText(record.lastNames))}</td>
      <td data-label="Cedula">${escapeHtml(record.documentNumber)}</td>
      <td data-label="Local de votacion">${escapeHtml(record.pollingPlace)}</td>
      <td data-label="Mesa">${escapeHtml(record.tableNumber)}</td>
      <td data-label="Orden">${escapeHtml(record.orderNumber)}</td>
      <td data-label="Sexo">${escapeHtml(sexLabel(record.sex))}</td>
      <td data-label="Fecha nac.">${escapeHtml(formatDate(record.birthDate))}</td>
    </tr>
  `).join("");
}

search.addEventListener("input", renderTable);

loadRecords().then((loadedRecords) => {
  records = loadedRecords;
  renderTable();
});
