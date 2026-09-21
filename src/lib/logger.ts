type SafeLogFields = {
  code?: string;
  durationMs?: number;
  operation?: string;
  retryable?: boolean;
  route?: string;
  statusCode?: number;
};

function write(level: "info" | "warn" | "error", event: string, fields: SafeLogFields = {}) {
  const record = { timestamp: new Date().toISOString(), level, event, ...fields };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, fields?: SafeLogFields) => write("info", event, fields),
  warn: (event: string, fields?: SafeLogFields) => write("warn", event, fields),
  error: (event: string, fields?: SafeLogFields) => write("error", event, fields),
};
